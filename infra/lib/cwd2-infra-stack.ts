import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as fs from 'fs';
import * as path from 'path';

export interface Cwd2InfraStackProps extends cdk.StackProps {
  /** 운영 도메인 (apex). 지정 시 Route 53 호스팅 영역 + CloudFront + 레코드까지 생성. */
  readonly domainName?: string;
  /** ACM 인증서 ARN (us-east-1). 지정 시 CloudFront 활성화. */
  readonly certificateArn?: string;
}

/**
 * cwd2 — 단일 EC2 운영 인프라 (비용 최소화)
 *
 * 구성:
 *  - VPC: 새로 생성, 1 AZ public-only subnet (NAT 게이트웨이 비용 절감)
 *  - S3: 업로드 이미지 버킷 (private, EC2 IAM Role에서만 접근)
 *  - EC2: t4g.small (ARM, ~$15/월), EBS gp3 30GB
 *  - IAM Role: SSM 관리 + S3 R/W 권한
 *  - SG: 80/443/22 인바운드
 *
 * 미포함 (별도 PR):
 *  - RDS (현재는 EC2 내부 MySQL — 추후 분리 시 RDS db.t4g.micro)
 *  - Route 53 + ACM HTTPS
 *  - CloudWatch 알람
 *  - 자동 백업 정책
 */
export class Cwd2InfraStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly uploadsBucket: s3.IBucket;
  public readonly instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: Cwd2InfraStackProps = {}) {
    super(scope, id, props);

    // ── VPC ────────────────────────────────────────────
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 1,            // 비용 최소화 — 단일 AZ
      natGateways: 0,        // NAT $$$, 안 씀 — public subnet에 직접 배치
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // ── S3 Bucket (uploads) ────────────────────────────
    // public read 허용 (브라우저가 이미지 직접 GET 가능해야 함).
    // 업로드/삭제는 여전히 EC2 IAM Role 전용.
    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,         // ACL 기반 public은 차단
        ignorePublicAcls: true,
        blockPublicPolicy: false,      // 명시적 bucket policy로 public read 허용
        restrictPublicBuckets: false,
      }),
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // public read-only policy — GetObject만, 나머지는 IAM Role
    this.uploadsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject'],
        resources: [this.uploadsBucket.arnForObjects('*')],
      }),
    );

    // ── IAM Role for EC2 ───────────────────────────────
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'cwd2 EC2 instance role - S3 R/W + SSM Session Manager',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    // 업로드 버킷 R/W 권한
    this.uploadsBucket.grantReadWrite(instanceRole);
    // (선택) Parameter Store에서 시크릿 읽기
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/cwd2/*`,
        ],
      }),
    );

    // ── Security Group ─────────────────────────────────
    const sg = new ec2.SecurityGroup(this, 'AppServerSG', {
      vpc: this.vpc,
      description: 'cwd2 app server SG - 80/443 public, 22 emergency only',
      allowAllOutbound: true,
    });
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH (emergency only, prefer SSM)');

    // ── User Data ──────────────────────────────────────
    const userDataScript = fs.readFileSync(
      path.join(__dirname, 'assets/user-data.sh'),
      'utf-8',
    );
    const userData = ec2.UserData.forLinux();
    userData.addCommands(userDataScript);

    // ── EC2 Instance ───────────────────────────────────
    this.instance = new ec2.Instance(this, 'AppServer', {
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
      // AMI 고정: latestAmazonLinux2023()는 배포 시점의 최신 AMI로 해석돼, 새 AMI가 나오면
      // 아무 변경 없는 배포에도 인스턴스가 교체(=DB 유실)된다. OS 업데이트는 이 값을 직접 올릴 때만.
      machineImage: ec2.MachineImage.genericLinux({
        'ap-northeast-2': 'ami-0aa00e1a65838ccde', // Amazon Linux 2023 arm64, 2026-10-05 교체 시점
      }),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(30, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: false,   // 종료 시에도 데이터 보존
            encrypted: true,
          }),
        },
      ],
      securityGroup: sg,
      role: instanceRole,
      userData,
      requireImdsv2: true,
    });

    // ── Elastic IP ─────────────────────────────────────
    const eip = new ec2.CfnEIP(this, 'AppServerEIP', {
      domain: 'vpc',
      instanceId: this.instance.instanceId,
    });

    // ── Route 53 Hosted Zone ──────────────────────────
    let hostedZone: route53.IHostedZone | undefined;
    if (props.domainName) {
      hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
        zoneName: props.domainName,
        comment: 'cwd2 - production DNS',
      });

      new cdk.CfnOutput(this, 'HostedZoneId', {
        value: hostedZone.hostedZoneId,
      });
      new cdk.CfnOutput(this, 'NameServers', {
        value: cdk.Fn.join(', ', hostedZone.hostedZoneNameServers ?? []),
        description: 'Put these into Gabia "타사 네임서버" field (one per slot)',
      });
    }

    // ── CloudFront + HTTPS (도메인 + 인증서 모두 있을 때) ──
    if (props.domainName && props.certificateArn && hostedZone) {
      const certificate = acm.Certificate.fromCertificateArn(
        this, 'ImportedCertificate', props.certificateArn,
      );

      // apex → www 301 리다이렉트용 CloudFront Function
      const apexRedirectFn = new cloudfront.Function(this, 'ApexToWwwRedirect', {
        code: cloudfront.FunctionCode.fromInline(`
          function handler(event) {
            var request = event.request;
            var host = request.headers.host && request.headers.host.value;
            if (host === '${props.domainName}') {
              return {
                statusCode: 301,
                statusDescription: 'Moved Permanently',
                headers: {
                  location: { value: 'https://www.${props.domainName}' + request.uri }
                }
              };
            }
            return request;
          }
        `),
      });

      // CloudFront는 origin으로 IP 직접 못 받음 → origin.<domain> A 레코드를 EIP로 매핑
      const originHostname = `origin.${props.domainName}`;
      new route53.ARecord(this, 'OriginAlias', {
        zone: hostedZone,
        recordName: 'origin',
        target: route53.RecordTarget.fromIpAddresses(eip.ref),
      });

      const ec2Origin = new origins.HttpOrigin(originHostname, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        readTimeout: cdk.Duration.seconds(60),
        keepaliveTimeout: cdk.Duration.seconds(5),
      });

      const distribution = new cloudfront.Distribution(this, 'Distribution', {
        comment: 'cwd2 - prod',
        domainNames: [props.domainName, `www.${props.domainName}`],
        certificate,
        defaultRootObject: '',
        priceClass: cloudfront.PriceClass.PRICE_CLASS_200, // 일본·한국 캐시 포함
        defaultBehavior: {
          origin: ec2Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // 동적 페이지 — 캐싱 X
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          functionAssociations: [{
            function: apexRedirectFn,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          }],
        },
      });

      // Route 53 A 레코드 (apex + www) → CloudFront alias
      new route53.ARecord(this, 'ApexAlias', {
        zone: hostedZone,
        recordName: undefined,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(distribution),
        ),
      });
      new route53.ARecord(this, 'WwwAlias', {
        zone: hostedZone,
        recordName: 'www',
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(distribution),
        ),
      });

      new cdk.CfnOutput(this, 'CloudFrontDomain', {
        value: distribution.distributionDomainName,
      });
      new cdk.CfnOutput(this, 'SiteUrl', {
        value: `https://www.${props.domainName}`,
      });
    }

    // ── Outputs ────────────────────────────────────────
    new cdk.CfnOutput(this, 'InstanceId', {
      value: this.instance.instanceId,
      description: 'SSM access: aws ssm start-session --target {InstanceId}',
    });
    new cdk.CfnOutput(this, 'PublicIp', {
      value: eip.ref,
      description: 'Elastic IP - target for domain A record',
    });
    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: this.uploadsBucket.bucketName,
      description: 'Set this as backend env var S3_BUCKET',
    });
    new cdk.CfnOutput(this, 'UploadsBucketRegion', {
      value: this.region,
    });
  }
}
