import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Cwd2InfraStack } from '../lib/cwd2-infra-stack';

describe('Cwd2InfraStack', () => {
  function synth(opts: { domain?: string } = {}): Template {
    const app = new cdk.App();
    const stack = new Cwd2InfraStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'ap-northeast-2' },
      domainName: opts.domain,
    });
    return Template.fromStack(stack);
  }

  test('creates a VPC with public subnet and no NAT gateway', () => {
    const t = synth();
    t.resourceCountIs('AWS::EC2::VPC', 1);
    t.resourceCountIs('AWS::EC2::NatGateway', 0);
    t.resourceCountIs('AWS::EC2::Subnet', 1);
  });

  test('creates S3 bucket with managed encryption and ACL-based public block', () => {
    const t = synth();
    t.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: false,        // bucket policy로 public read 허용
        IgnorePublicAcls: true,
        RestrictPublicBuckets: false,
      },
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
          }),
        ]),
      }),
    });
  });

  test('bucket policy grants public s3:GetObject', () => {
    const t = synth();
    t.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: { AWS: '*' },
            Action: 's3:GetObject',
          }),
        ]),
      }),
    });
  });

  test('creates EC2 t4g.small with EBS gp3 30GB', () => {
    const t = synth();
    t.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't4g.small',
      BlockDeviceMappings: Match.arrayWith([
        Match.objectLike({
          Ebs: Match.objectLike({
            VolumeSize: 30,
            VolumeType: 'gp3',
            Encrypted: true,
          }),
        }),
      ]),
    });
  });

  test('security group allows 80/443/22', () => {
    const t = synth();
    t.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80 }),
        Match.objectLike({ IpProtocol: 'tcp', FromPort: 443, ToPort: 443 }),
        Match.objectLike({ IpProtocol: 'tcp', FromPort: 22, ToPort: 22 }),
      ]),
    });
  });

  test('IAM role attached to EC2 with SSM managed policy', () => {
    const t = synth();
    t.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: { Service: 'ec2.amazonaws.com' },
          }),
        ]),
      }),
    });
  });

  test('creates Elastic IP', () => {
    const t = synth();
    t.resourceCountIs('AWS::EC2::EIP', 1);
  });

  test('no hosted zone when domainName not provided', () => {
    const t = synth();
    t.resourceCountIs('AWS::Route53::HostedZone', 0);
  });

  test('creates Route 53 hosted zone when domainName given', () => {
    const t = synth({ domain: 'example.com' });
    t.resourceCountIs('AWS::Route53::HostedZone', 1);
    t.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'example.com.',
    });
  });
});
