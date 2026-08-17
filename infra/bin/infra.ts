#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { Cwd2InfraStack } from '../lib/cwd2-infra-stack';
import { Cwd2CertStack } from '../lib/cwd2-cert-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const primaryRegion = process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-2';
// 두 번째 사이트라 기본 도메인 없음. 필요 시 -c domainName=example.com 로 지정.
const domainName: string | undefined = app.node.tryGetContext('domainName');
const hostedZoneId: string | undefined = app.node.tryGetContext('hostedZoneId');

// 인증서 스택은 us-east-1 (CloudFront 요구사항).
// Phase 2에선 hostedZoneId를 context로 넘겨서 ACM이 DNS 검증을 자동 수행하도록 함.
let certStack: Cwd2CertStack | undefined;
if (domainName && hostedZoneId) {
  certStack = new Cwd2CertStack(app, 'Cwd2CertStack', {
    env: { account, region: 'us-east-1' },
    description: 'cwd2 - ACM certificate (us-east-1 for CloudFront)',
    crossRegionReferences: true,
    domainName,
    hostedZoneId,
  });
}

new Cwd2InfraStack(app, 'Cwd2InfraStack', {
  env: { account, region: primaryRegion },
  description: 'cwd2 - single EC2 + S3 + Route 53 + CloudFront',
  crossRegionReferences: true,
  domainName,
  certificateArn: certStack?.certificate.certificateArn,
});
