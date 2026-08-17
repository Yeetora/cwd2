# infra — cwd2 AWS 인프라 (CDK TypeScript)

## 아키텍처

```
Internet → Elastic IP → EC2 t4g.small (Amazon Linux 2023, ARM)
                            ├── Nginx :80/:443  (리버스 프록시)
                            ├── Next.js :3000   (systemd)
                            ├── Spring Boot :8080 (systemd)
                            └── MySQL :3306     (mariadb-server 패키지)
                       ↘  S3 Bucket (uploads, private, IAM Role 접근)
```

- 비용: t4g.small ~$15/월 + EBS gp3 30GB ~$2.4/월 + EIP(붙어있을 때 무료) + S3 사용량(거의 무료)
- 트래픽 데이터 전송 별도

## 명령어

```bash
cd infra
npm install            # 의존성 설치
npm test               # CDK 스택 단위 테스트 (jest)
npx cdk synth          # CloudFormation 합성 (AWS 자격증명 불필요)
npx cdk diff           # 배포된 스택과의 차이 (자격증명 필요)
npx cdk deploy         # 실제 배포 (자격증명 필요)
npx cdk destroy        # 전체 인프라 제거 (S3 버킷은 RETAIN 정책으로 남음)
```

## 자격증명 (사용자 직접 설정)

```bash
aws configure                                   # IAM Access Key/Secret, region=ap-northeast-2
aws sts get-caller-identity                     # 확인
npx cdk bootstrap aws://ACCOUNT_ID/ap-northeast-2  # CDK 부트스트랩 (계정·리전당 1회)
```

## 변경 흐름

1. `lib/cwd2-infra-stack.ts` 수정
2. `npm test` + `npx cdk synth`로 검증
3. PR 올리고 CI 통과 확인 후 머지
4. main에서 `npx cdk deploy` (또는 GitHub Actions CD가 자동 — 추후 PR)

## 자원 보호

- S3 버킷: `removalPolicy: RETAIN` — 스택 삭제해도 업로드 이미지는 남음
- EBS 볼륨: `deleteOnTermination: false` — EC2 종료 시에도 데이터 보존
- 운영 시작 후 실수로 `cdk destroy` 해도 데이터는 살아있음
