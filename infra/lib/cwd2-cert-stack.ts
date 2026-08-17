import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

export interface Cwd2CertStackProps extends cdk.StackProps {
  /** 도메인 (apex). 인증서는 apex + www SAN로 발급. */
  readonly domainName: string;
  /** Route 53 hosted zone ID — 다른 스택에서 export 후 참조. */
  readonly hostedZoneId: string;
}

/**
 * CloudFront는 us-east-1에 있는 ACM 인증서만 사용 가능하므로 별도 스택으로 분리.
 * DNS 검증은 Route 53 hosted zone(다른 리전) 통해 자동.
 */
export class Cwd2CertStack extends cdk.Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: Cwd2CertStackProps) {
    super(scope, id, props);

    // Route 53 hosted zone 참조 (이름은 알아야 함, ID와 함께 lookup)
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    });

    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: props.domainName,
      subjectAlternativeNames: [`www.${props.domainName}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      exportName: 'Cwd2CertificateArn',
    });
  }
}
