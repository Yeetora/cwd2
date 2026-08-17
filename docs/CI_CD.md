# CI/CD 가이드

## CI (`.github/workflows/ci.yml`)
PR이 열리거나 main에 push되면 자동 실행:
- **Backend** — `./gradlew test` (H2 in-memory)
- **Frontend** — `npm ci → lint → build`
- **Infra** — `npm install → npm test → cdk synth`

세 job이 모두 통과해야 머지 가능. 머지 차단을 강제하려면 GitHub Settings → Branches → Branch protection rule 추가.

## CD (`.github/workflows/deploy.yml`)
**main에 push되면 자동 실행** (PR 머지 = main push). 수동 실행도 가능 (`workflow_dispatch`).

흐름:
1. checkout
2. Java 21 / Node 24 setup
3. AWS 자격증명 구성 (Secrets에서 주입)
4. `./scripts/deploy.sh` 실행 — 빌드 → S3 업로드 → SSM Send Command → EC2 재시작
5. Smoke test — `/api/health` + `/` HTTP 200 검증

## 필수 GitHub Secrets (사용자 설정)

레포 페이지 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| 이름 | 값 | 예시 |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | 배포용 IAM 사용자의 Access Key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | 해당 사용자의 Secret | `xxxx...` |

선택:
| 이름 | 기본값 | 비고 |
|---|---|---|
| `AWS_REGION` | `ap-northeast-2` | 다른 리전 쓸 때만 |

Variables (Settings → Secrets and variables → Actions → **Variables** 탭):
| 이름 | 기본값 |
|---|---|
| `STACK_NAME` | `Cwd2InfraStack` |

⚠️ **권장 보안 설정**:
- 배포 전용 IAM 사용자(`cwd-admin`)는 **MFA 활성화** + Access Key를 90일마다 회전
- 운영 안정화 후 PowerUserAccess → 최소 권한 정책으로 좁히기:
  - `cloudformation:*`, `s3:*` (배포 버킷), `ssm:SendCommand`, `ec2:Describe*`, `iam:PassRole`

## 트러블슈팅

**SSM Send Command가 실패하면:**
- EC2의 SSM agent가 online인지 확인:
  ```
  aws ssm describe-instance-information --filters "Key=InstanceIds,Values=i-xxx"
  ```
- IAM Role(InstanceRole)에 `AmazonSSMManagedInstanceCore` 정책 있는지 확인

**빌드만 실패하면:**
- 로컬에서 동일 명령으로 재현 후 디버깅
- `./gradlew test` 또는 `cd frontend && npm ci && npm run build`

**Smoke test 실패하면:**
- EC2의 systemd 서비스 상태 확인:
  ```
  aws ssm send-command --instance-ids i-xxx --document-name "AWS-RunShellScript" \
    --parameters 'commands=["sudo systemctl status cwd2-backend cwd2-frontend"]'
  ```
- 로그: `/var/log/cwd2-backend.log`, `/var/log/cwd2-frontend.log`

## 수동 배포 (CI 우회)
```
INSTANCE_ID=i-xxx UPLOADS_BUCKET=cwd2-... ./scripts/deploy.sh
```
