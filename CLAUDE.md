# 프로젝트 규칙 (CLAUDE.md)

이 파일은 본 프로젝트에서 작업 시 반드시 지켜야 할 규칙을 정의한다.
새로운 규칙이 추가되거나 변경되면 이 문서를 우선 갱신한다.

---

## 1. 프로젝트 개요

- **목적:** 인테리어 회사 홈페이지 (포트폴리오 쇼케이스 + 사장님용 관리자 페이지)
- **공개 영역:** 일반 고객이 접근. 포트폴리오/회사소개/문의.
- **관리자 영역:** 사장님 단독 계정. 포트폴리오 CRUD, 문의 확인. **고객에게 절대 노출 금지.**

## 2. 기술 스택 (확정, 임의 변경 금지)

| 영역 | 스택 |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| Backend | Spring Boot 3.x + Java 21 |
| Build (BE) | Gradle (Kotlin DSL) |
| DB | MySQL 8.x |
| ORM | Spring Data JPA + Hibernate |
| 인증 | JWT (Access Token) |
| 이메일 | Spring Mail (SMTP) |
| 이미지 저장 | 로컬 파일시스템 (S3 전환 가능하게 인터페이스 추상화) |

## 3. 디렉토리 구조

```
cwd2/
├── CLAUDE.md            # 본 문서
├── docs/
│   ├── FEATURES.md      # 기능 정의서
│   └── PLAN.md          # 개발 계획서 / 단계별 진행
├── frontend/            # Next.js
├── backend/             # Spring Boot
└── assets/              # 사용자가 제공할 로고/포트폴리오 원본 (gitignore)
```

> 이 저장소는 `money/` (첫 번째 인테리어 사이트) 코드를 클론한 두 번째 인테리어 사이트다.
> 백엔드 구조/코드는 그대로 재사용, 프런트 디자인은 별도 브랜딩으로 갈 예정.
> Java 패키지는 관행상 `com.chaeuda`를 유지 (내부 코드라 격리에 영향 없음).
> 운영 격리 대상은 스택명/SSM 경로/DB/시스템d/쿠키명 등 외부 식별자만 `cwd2`로 리네임됨.

## 4. 언어 / 응답 규칙

- 사용자와의 대화는 **한국어**로 응답.
- 코드 주석은 꼭 필요한 경우에만 작성. 필요하다면 한국어로 작성.
- 변수/함수/클래스명은 영어.
- UI 텍스트는 한국어.

## 5. 보안 규칙 (절대 위반 금지)

- 관리자 API는 **서버 측 JWT 검증 필수**. 프론트 가드만으로 보호 금지.
- 관리자 URL은 별도 경로(`/admin`)로 분리하되, 보호의 본질은 서버에 있음.
- 비밀번호는 BCrypt 해싱 후 저장.
- JWT Secret, DB 비밀번호 등은 환경변수로 관리. 코드/Git에 직접 커밋 금지.
- 파일 업로드는 확장자/MIME/사이즈 검증 필수.
- CORS는 화이트리스트 방식.

## 6. 코드 컨벤션

### Frontend (Next.js / TS)
- App Router 사용 (`app/` 디렉토리).
- 컴포넌트: PascalCase, 파일명도 동일.
- API 호출은 `lib/api/` 하위 모듈로 격리.
- 환경변수는 `NEXT_PUBLIC_*`(공개) / 서버 전용 분리.
- **반응형은 모바일 우선(Mobile-first)**. Tailwind 브레이크포인트 `sm/md/lg/xl` 활용. 핸드폰·아이패드·데스크탑 모두 정상 동작해야 함.
- 메뉴: Home / About us / Project(주거·상업) / Process / Contact / Blog / Instagram(외부). **Youtube/Press/Board 미포함.**
- 포트폴리오 카테고리는 **RESIDENTIAL / COMMERCIAL** 두 값만 허용.

### Backend (Spring Boot / Java 21)
- 패키지 구조: `com.chaeuda.{feature}.{layer}` (예: `com.chaeuda.portfolio.controller`).
- 레이어: `controller` / `service` / `repository` / `domain` / `dto`.
- DTO와 Entity는 분리. Entity 직접 노출 금지.
- 예외는 `@RestControllerAdvice`로 일괄 처리.
- Lombok 사용 허용 (`@Getter`, `@Builder`, `@RequiredArgsConstructor`).

## 7. Git / 작업 규칙

- 작업 단위로 커밋. 한 커밋에 여러 기능 섞지 말 것.
- 사용자가 명시적으로 요청하지 않는 한 커밋/푸시는 자동 수행하지 않음.
- `assets/`, `.env*`, `node_modules/`, `build/`, `target/`, 업로드된 이미지 폴더는 gitignore.

## 8. 작업 진행 규칙

- 큰 단계 시작 전 사용자에게 확인.
- `docs/PLAN.md`에 정의된 단계 순서를 따른다. 단계 변경 시 PLAN.md를 먼저 갱신.
- 새 기능 요청은 `docs/FEATURES.md`에 반영한 뒤 구현.
- 의문점/결정 필요한 사항은 임의 진행하지 말고 질문할 것.

## 8-1. 테스트 정책 (필수)

- **모든 백엔드 API와 Repository는 테스트 코드 작성 필수.**
- 단계 완료 보고 전에 반드시 `./gradlew test`를 실행해서 **전체 통과**를 확인해야 함. 통과하지 못한 상태로 "완료" 보고 금지.
- 테스트 DB는 **H2(MySQL compatibility 모드)** 사용. `src/test/resources/application-test.yml`에 설정. 테스트 클래스는 `@ActiveProfiles("test")`.
- 레이어별:
  - Controller: `@WebMvcTest` + `MockMvc`
  - Service: 순수 JUnit + Mockito
  - Repository: `@DataJpaTest`
  - 통합: `@SpringBootTest` (필요할 때만)
- 정책상 새 API/기능 추가 시 해당 테스트가 함께 추가되지 않으면 그 PR/커밋은 미완성으로 간주.

## 9. 사용자 환경

- OS: macOS (darwin)
- 작업 경로: `/Users/dhssnfl258/playground/cwd2`
- 로고/포트폴리오 이미지는 사용자가 추후 `assets/` 등 폴더에 투입 후 별도 지시 예정.

## 10. 백엔드 1차 MVP 결정사항

- **DB:** MySQL 8.x, 로컬은 docker-compose. 운영 전환 시 별도 결정.
- **스키마 관리:** 1차 MVP는 `spring.jpa.hibernate.ddl-auto=update`. **Flyway 도입은 운영 직전 단계로 펜딩.**
- **인증:** Spring Security/JWT 미사용. 환경변수 비밀번호 + HMAC 서명 쿠키 기반 최소 인증. 추후 정식 인증으로 교체.
- **관리자 초기 계정:** `admin` / `admin` (환경변수로 오버라이드 가능). ⚠️ 운영 전 반드시 변경.
- **이메일 알림:** Spring Mail 1차 펜딩. 문의 등록 API의 메일 발송 부분만 제외하고 DB 저장은 정상 동작.
- **이미지 저장:** 로컬 `backend/uploads/` 시작 → 추후 **S3 마이그레이션 예정**. `ImageStorage` 인터페이스로 추상화.
- **파일 업로드 제한:** 단일 파일 10MB.
- **포트폴리오 정렬:** `createdAt DESC` 기본.
