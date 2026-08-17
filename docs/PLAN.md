# 개발 계획서 (PLAN.md)

본 문서는 단계별 개발 진행 계획과 현재 상태를 관리한다.
각 단계 완료 시 체크 표시하고, 변경된 결정은 본 문서에 반영한다.

> **cwd2 안내:** 이 파일은 첫 번째 인테리어 사이트(`money/`)의 PLAN에서 복제됨.
> 백엔드/인프라 골격(Phase 0~7 대부분)은 이미 완료된 상태를 이어받았고,
> 남은 실제 작업은 (a) 프런트 리브랜딩, (b) AWS 계정에 신규 스택 배포,
> (c) 도메인 구매·연결(추후) 정도. 이 문서는 상세 재작성 예정.

---

## 단계 (Phase)

### Phase 0. 기반 정비
- [x] 요구사항 확정 (스택 / 단일 관리자 / 한국어 / 이메일 알림)
- [x] CLAUDE.md 작성
- [x] FEATURES.md 작성
- [x] PLAN.md 작성
- [ ] `.gitignore` 작성
- [ ] `README.md` 간단 작성

### Phase 1. 백엔드 골격
- [ ] Spring Boot 3.x + Java 21 프로젝트 생성 (`backend/`)
- [ ] Gradle 의존성: web, data-jpa, security, validation, mail, lombok, postgresql, jjwt
- [ ] MySQL 연결 설정 (개발용 docker-compose 또는 로컬 설치 안내)
- [ ] 패키지 구조 골격 생성
- [ ] 헬스체크 엔드포인트 (`/api/health`)
- [ ] 글로벌 예외 핸들러
- [ ] CORS 설정

### Phase 2. 도메인 / DB
- [ ] Entity 작성: AdminUser, Portfolio, PortfolioImage, Inquiry
- [ ] Repository 작성
- [ ] DDL 자동 생성 또는 Flyway 마이그레이션 설정 (선택)
- [ ] 초기 AdminUser 시드 (사장님 계정 1개)

### Phase 3. 인증 (펜딩 — 추후 도입)
- [ ] ~~Spring Security 설정~~ (PENDING)
- [ ] ~~JWT 발급/검증~~ (PENDING)
- 1차 MVP에서는 관리자 페이지를 **최소 형태**(예: 환경변수 패스워드 1개 + 단순 쿠키/헤더 체크)로만 보호.
- 정식 인증(Spring Security + JWT)은 MVP 검증 후 별도 Phase로 도입.

### Phase 4. 포트폴리오 API
- [ ] 공개: 목록 (`GET /api/portfolios?category=RESIDENTIAL|COMMERCIAL`), 상세 (`GET /api/portfolios/{id}`)
- [ ] 관리자: 등록/수정/삭제, 비공개 포함 조회
- [ ] 카테고리는 **RESIDENTIAL / COMMERCIAL** 두 값으로 한정
- [ ] 이미지 업로드 API (다중 파일, 순서 지정, 대표 이미지)
- [ ] 이미지 저장 추상화 인터페이스 (`ImageStorage`) + 로컬 구현

### Phase 5. 문의 API + 이메일
- [ ] 공개: 문의 등록 (`POST /api/inquiries`)
- [ ] 관리자: 문의 목록/상세/상태 변경/삭제
- [ ] Spring Mail 설정 (SMTP)
- [ ] 문의 등록 시 사장님 이메일로 알림 발송 (비동기 권장)
- [ ] ~~Blog API~~ (PENDING — 추후 별도 Phase)

### Phase 6. 프론트엔드 골격
- [ ] Next.js (App Router) + TS + Tailwind 셋업 (`frontend/`)
- [ ] **반응형 기반 설정:** Tailwind 브레이크포인트(sm/md/lg/xl) 기준 컨테이너 정책 수립
- [ ] 공통 레이아웃 (헤더/푸터)
  - 데스크탑: 가로 메뉴
  - 태블릿/모바일: 햄버거 드로어
  - 메뉴: Home / About us / Project(주거·상업 서브) / Process / Contact / Blog / Instagram(외부)
- [ ] API 클라이언트 모듈 (`lib/api/`)
- [ ] 환경변수 설정 (API base URL)

### Phase 7. 공개 페이지 구현
- [ ] Home
- [ ] About us
- [ ] Project — 주거공간 목록 (`/project/residential`)
- [ ] Project — 상업공간 목록 (`/project/commercial`)
- [ ] Project — 상세 (갤러리, 같은 카테고리 내 이전/다음)
- [ ] Process
- [ ] Contact (폼 검증 + 제출)
- [ ] Blog 목록 / 상세
- [ ] 전 페이지 모바일(아이폰)·태블릿(아이패드)·데스크탑 검증

### Phase 8. 관리자 페이지 구현
- [ ] 로그인 페이지
- [ ] 인증 가드 (서버 컴포넌트 / 미들웨어)
- [ ] 대시보드
- [ ] 포트폴리오 관리 (등록 시 **주거/상업 카테고리 선택 필수**, 이미지 업로드 UI)
- [ ] 문의 관리
- [ ] Blog 관리

### Phase 9. 디자인 반영
- [x] 레퍼런스 사이트 분석: https://romentordesign.com/aboutcorp
- [ ] 디자인 시스템 (색상/타이포/스페이싱/그리드) 정의
- [ ] 미니멀·세련된 톤으로 컴포넌트 스타일 일괄 적용
- [ ] 반응형 점검(모바일/태블릿/데스크탑)

### Phase 10. 자산 투입 + QA
- [ ] 사용자 제공 로고/포트폴리오 이미지 배치
- [ ] 시드 데이터 또는 직접 업로드
- [ ] 전체 기능 점검 (모바일/PC)
- [ ] 접근성/SEO 점검

### Phase 11. 배포 (별도 협의)
- [ ] 인프라 결정 (단순 VPS / Vercel + 백엔드 분리 / Docker 등)
- [ ] HTTPS, 도메인, 이메일 SMTP 운영 설정

---

## 현재 상태

- **현재 Phase:** 백엔드 Phase A~F-2 완료, 프런트 관리자 페이지 완료, 공개 페이지 백엔드 연결 완료, 디자인 반영 진행 중
- **펜딩 항목:** Spring Security/JWT, Blog 기능, **SMTP 이메일 알림**, **Flyway 도입** — 모두 MVP 후
- **다음 세션 TODO:** 아래 "다음 세션 TODO" 섹션 참조

## 다음 세션 TODO (2026-05-17 작업 종료 시점 기록)

### 디자인·UX 다듬기 (우선순위 순)

- [x] **헤더 스크롤 동작 개선** (2026-05-19 완료)
  - 스크롤 다운 시 헤더가 사라지고, 스크롤 업 시 다시 나타남 (`-translate-y-full` 토글, 80px 이하는 항상 노출)
  - rAF 디바운스 + 6px 데드존으로 떨림 방지
  - TOP 버튼 (`components/TopButton.tsx`) — 400px 이상 스크롤 시 우측 하단 floating 노출, smooth scroll
  - 적용 범위: 공개 페이지만 (`(public)/layout.tsx`)

- [x] **메인 히어로 텍스트 가독성** (2026-05-19 완료)
  - h1: `font-light` → `font-medium`, `tracking-tight` 추가
  - 본문 p: `text-foreground/80` → `text-foreground/90 font-normal`
  - 모든 텍스트에 옅은 베이지톤 text-shadow (`0 1px~2px 8px rgba(245,239,229,0.5)`) — 배경과 톤 통일하면서 가독성 확보

- [x] **메인 CTA 버튼 톤 다듬기** (2026-05-19 완료)
  - 보더+배경 박스 → 텍스트 링크 + 밑줄 + 우측 화살표(→) 스타일
  - hover 시 화살표가 살짝 우측으로 슬라이드 (`translate-x-1`), 밑줄 진해짐
  - 페이지 톤과 자연스럽게 어우러지는 미니멀 구성

- [x] **헤더 컨테이너 높이 축소** (2026-05-19 완료)
  - 컨테이너: `h-36 / md:h-48` → `h-28 / md:h-40` (각 32px 축소)
  - 로고 크기는 `h-24 / md:h-36` 그대로 유지
  - 모바일 메뉴 오버레이 `top-36` → `top-28` 동기화

### 신규 (2026-05-19 추가)

- [ ] **카테고리 페이지(주거/상업) 히어로 이미지 관리**
  - `/project/residential`, `/project/commercial` 상단에 현재 비어있는 영역에 히어로/배너 이미지 노출
  - 관리자 페이지에서 카테고리별 히어로 이미지 업로드/교체/삭제 가능하게 구현
  - 데이터 모델 옵션 검토 필요:
    - (a) `category_hero` 테이블 신설 (category PK, image_path)
    - (b) `Portfolio`에 `isCategoryHero` 같은 플래그 추가 — 비추 (특수 케이스 섞임)
    - (c) `Setting` 같은 단순 key-value 테이블 (확장성)
  - 백엔드: 업로드 API + 조회 API (공개), `ImageStorage` 재활용
  - 프런트:
    - 관리자 — `/admin/portfolio` 또는 별도 `/admin/site` 경로에 카테고리 히어로 섹션
    - 공개 — 카테고리 페이지 상단에 이미지 + 기존 헤더 텍스트 오버레이
  - 테스트 코드 포함 (정책)

- [ ] **AWS 배포 + CI/CD 파이프라인**
  - 현재 로컬 dev 환경만 — 운영 환경 부재
  - **아키텍처 후보:**
    - **A. 단일 EC2 (저비용 추천)**: EC2 1대에 frontend(Next.js)+backend(Spring Boot), RDS MySQL, S3(업로드 이미지 이전), CloudFront(선택), Nginx 리버스 프록시. 월 $30~50 수준.
    - **B. 관리형 분리**: Frontend → Amplify Hosting, Backend → Elastic Beanstalk 또는 App Runner, RDS, S3. 더 안정적이지만 비용↑ ($80~150/월).
    - **C. ECS Fargate**: 컨테이너 기반. 확장성·운영 부담 균형, 학습곡선 있음.
  - **CI/CD**: GitHub Actions 권장 (코드를 GitHub에 올린다는 가정)
  - **선행 작업** (배포 전 필수):
    1. 코드를 Git 저장소(GitHub)에 푸시
    2. 이미지 저장소를 로컬 → S3로 마이그레이션 (`ImageStorage` 추상화 덕분에 `S3ImageStorage` 구현체만 추가)
    3. Spring Security/JWT 정식 도입 (운영 전 admin/admin 비밀번호 보호 강화)
    4. SMTP 활성화 (Phase G와 함께)
    5. Flyway 마이그레이션 도입 (운영 DB 스키마 관리)
    6. 도메인 + HTTPS (Route53 + ACM 또는 외부 도메인)
    7. 환경변수·시크릿 분리 (AWS Secrets Manager 또는 Parameter Store)

#### AWS 배포를 위해 사용자가 제공/결정해야 하는 것

**[1] AWS 계정 관련**
- AWS 계정 (결제수단 등록 완료)
- 어느 리전 사용할지? (한국 사용자 대상이면 `ap-northeast-2` 서울 추천)
- IAM 사용자 또는 AWS CLI Access Key/Secret — **루트 계정 credentials 절대 공유 금지**, 작업용 IAM 사용자 생성 후 필요한 최소 권한 부여
- 예상 월 예산 (가이드: A안 ~$50, B안 ~$120, C안 ~$80)

**[2] 아키텍처 선택**
- 위 A/B/C 중 어느 것?

**[3] 도메인**
- 보유 도메인 있는지? 새로 살건지? Route53에서 살 수 있음.
- 없으면 임시 AWS 기본 URL로 시작 가능 (운영 시 도메인 권장)

**[4] 코드 저장소**
- GitHub 계정 + 새 private repo 만들기
- 또는 GitLab/CodeCommit/Bitbucket — 선호도 알려주세요
- 현재 작업 디렉토리는 git 미초기화 상태 → 첫 커밋 + remote 연결 필요

**[5] 시크릿 값 (운영용)**
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` (운영용, admin/admin은 절대 사용 금지 — 강한 비밀번호로)
- `APP_AUTH_SECRET` (32자 이상 랜덤 문자열, 생성기로 만들어드릴 수 있음)
- `DB_PASSWORD` (RDS용 강한 비밀번호)
- `ADMIN_EMAIL` (운영 시 알림 수신 이메일)
- SMTP 정보 (Phase G 활성화 시): Gmail SMTP 또는 SES

**[6] 작업 권한**
- 만약 **나(Claude)가 직접 AWS 인프라를 생성**하길 원하면:
  - 작업용 IAM 사용자의 Access Key/Secret을 안전한 채널로 전달
  - 권장 최소 권한 policy: EC2/RDS/S3/IAM/CloudFront/Route53 관련 (구체 policy JSON 따로 제공 가능)
  - 또는 **AWS Console에서 사용자가 직접 만들고**, 나는 Terraform/CloudFormation 코드만 제공 — **이쪽이 안전성·복원성 면에서 권장**
- 자격증명 노출 위험을 고려해 **AWS 콘솔 작업은 사용자가 직접** 진행하고, 나는 명령어/스크립트/IaC 파일을 생성하는 방식 권장

#### 우선 작업 순서 제안
1. 위 [1]~[5] 결정 → 결정 사항 PLAN.md에 기록
2. Git 저장소 초기화 + 원격 푸시
3. 이미지 저장소 S3 전환 (`S3ImageStorage` 구현)
4. Spring Security/JWT 정식 도입
5. Flyway 도입
6. SMTP 활성화 (선택)
7. AWS 인프라 (IaC 파일 작성)
8. GitHub Actions 워크플로우 작성
9. 도메인/HTTPS 연결

- [ ] **GitBook 학습 노트 별도 레포 분리** (보류 — 추후 진행)
  - 현재 `docs/learn/` + `.gitbook.yaml`이 이 레포(`cwd_inter`)에 머지된 상태
  - 같은 레포에 두면 docs-only 변경에도 deploy 워크플로우가 도는 비효율 + 권한 분리 어려움
  - **계획:**
    1. 새 레포(예: `chaeuda-docs`) 생성
    2. `docs/learn/*.md`를 새 레포로 이전 (히스토리 보존하려면 `git filter-repo` 사용)
    3. 새 레포 루트에 `SUMMARY.md`, `README.md` 배치 + GitBook Space 연결
    4. 이 레포에서 `docs/learn/`, `.gitbook.yaml` 삭제
  - GitBook 자동 동기화는 분리된 다음에 진행 (지금은 연결 안 함)

### 참고
- 위 작업은 모두 **공개 페이지 디자인 다듬기 (Phase 9 연장선)**
- 백엔드 Phase G (문의 API)와 프런트 `/admin/inquiries` 본 구현은 별도 트랙
- **블로커:** Docker Desktop 첫 실행 필요 (CLI PATH 등록용)

---

## 의사결정 로그

| 일자 | 결정 | 근거 |
|---|---|---|
| 2026-05-16 | Next.js + Spring Boot 3 + Java 21 + MySQL 확정 | SSR/SEO 유리, Java 21 가상 스레드, MySQL의 JSON·확장성 |
| 2026-05-16 | 관리자 계정 단일 운영 | 사장님 1인 운영 요구 |
| 2026-05-16 | 다국어 미지원 | 1차 한국어만 |
| 2026-05-16 | 이미지 저장은 로컬 시작 + 인터페이스 추상화 | 추후 S3 마이그레이션 용이성 |
| 2026-05-16 | 메뉴 최종: Home/About/Project(주거·상업)/Process/Contact/Blog/Instagram | romentordesign.com 레퍼런스 + 사용자가 Youtube/Press/Board 제외 명시 |
| 2026-05-16 | 포트폴리오 카테고리 RESIDENTIAL/COMMERCIAL 2개로 한정(ETC 제거) | 사용자가 주거/상업 분리 업로드 명시 |
| 2026-05-16 | 반응형(모바일/태블릿/데스크탑) 필수 | 사용자가 핸드폰·아이패드 지원 요구 |
| 2026-05-16 | Spring Security/JWT 펜딩, Blog 펜딩, 관리자 최소 인증으로 시작 | 사용자가 1차 MVP 범위 축소 요청 |
| 2026-05-16 | 프론트엔드 골격을 백엔드보다 먼저 작성하고 사용자 검수 받기로 | 사용자 명시 |
| 2026-05-16 | DB를 PostgreSQL → MySQL 8로 변경 | 사용자가 MySQL 선호 |
| 2026-05-16 | 스키마 관리는 `ddl-auto=update` (Flyway는 펜딩) | 1인 MVP 단계 |
| 2026-05-16 | 패키지명 `com.chaeuda` 확정 | 상호명 "채우다 by design" 영문화 |
| 2026-05-16 | 관리자 초기 계정 admin/admin (환경변수 오버라이드 가능) | 사용자 명시 — 운영 전 변경 필수 |
| 2026-05-16 | SMTP/메일 발송 펜딩 | 사용자 요청, MVP 후 도입 |
| 2026-05-16 | 이미지 저장은 로컬 `backend/uploads/` 시작, 추후 S3 전환 | 사용자 명시 |
