# 배포 가이드

## 구성도 (계획)

```
[ User Browser ]
       │
       ▼ HTTPS
[ ALB / 단일 EC2의 Nginx ]
       ├── /        →  Next.js (3000)
       └── /api/*   →  Spring Boot (8080)
                          ├── MySQL (RDS 또는 동일 EC2)
                          └── S3 (이미지 저장소)
```

1차 운영은 **단일 EC2 + RDS(또는 동일 EC2 MySQL) + S3** 구성, CDK로 프로비저닝.

---

## 운영 환경변수 (필수)

### 백엔드
복사: `backend/.env.example` 참조.

대표값:
- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` (첫 실행 시 시드)
- `APP_AUTH_SECRET` — 32바이트+ 무작위 문자열
- `AUTH_COOKIE_SECURE=true` (HTTPS 환경)
- `CORS_ALLOWED_ORIGINS=https://your-domain.example.com`
- `STORAGE_TYPE=s3`, `S3_BUCKET`, `S3_REGION`

### 프런트
- `NEXT_PUBLIC_API_BASE` — 백엔드 API URL (운영 도메인)

---

## 시크릿 관리

운영 시 시크릿(`DB_PASSWORD`, `APP_AUTH_SECRET`, `ADMIN_PASSWORD`)은 다음 중 하나로 관리:

1. **AWS Systems Manager Parameter Store** (무료, Standard tier)
   - 키: `/cwd2/prod/DB_PASSWORD` 등 계층 구조
   - EC2 IAM Role에 `ssm:GetParameter` 권한 부여
2. **AWS Secrets Manager** (월 $0.40/시크릿, 자동 회전 지원)
3. **GitHub Actions Secrets** — CI/CD 단계에서만 사용

⚠️ Git 저장소에 시크릿 평문 커밋 금지. `.env.example`만 커밋.

---

## AWS 인프라 (CDK)

추후 PR에서 작성 예정. 대략:
- VPC + Subnets
- EC2 t4g.small + EBS 30GB + Security Group (22, 80, 443)
- S3 Bucket (private, EC2 IAM Role에서만 접근)
- RDS db.t4g.micro MySQL (또는 EC2 동일 인스턴스 MySQL — 비용 최소화)
- Route 53 + ACM (도메인 보유 시)

배포 명령어 (예정):
```
cd infra/
cdk synth
cdk diff
cdk deploy
```

---

## EC2 부트스트랩 (예정)

`user_data` 스크립트로 다음 자동 설치:
- amazon-corretto-21 (Java 21)
- Node 24
- nginx
- mysql-server (또는 RDS 사용 시 생략)
- systemd 유닛 파일 (backend.service, frontend.service)
- 환경변수는 SSM Parameter Store에서 가져와 systemd EnvironmentFile에 주입

---

## 로컬 운영 환경 시뮬레이션

운영 동등 환경 테스트:
```bash
# 백엔드
cd backend
export SPRING_PROFILES_ACTIVE=prod
export DB_URL=jdbc:mysql://localhost:3306/cwd2?useSSL=false&serverTimezone=UTC
export DB_USERNAME=cwd2
export DB_PASSWORD=cwd2
export ADMIN_PASSWORD=<strong>
export APP_AUTH_SECRET=$(openssl rand -base64 48)
export AUTH_COOKIE_SECURE=false   # 로컬 HTTPS 아니면 false
export CORS_ALLOWED_ORIGINS=http://localhost:3000
export STORAGE_TYPE=local
./gradlew bootRun
```

```bash
# 프런트
cd frontend
NEXT_PUBLIC_API_BASE=http://localhost:8080 npm run build
NEXT_PUBLIC_API_BASE=http://localhost:8080 npm start
```

---

## 헬스체크 / 모니터링

- `GET /api/health` — 백엔드 헬스
- 로그: `/var/log/cwd2-backend.log`, `/var/log/cwd2-frontend.log` (예정)
- CloudWatch Logs 연동 추후 추가
