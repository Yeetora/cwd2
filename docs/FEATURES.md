# 기능 정의서 (FEATURES.md)

본 문서는 인테리어 홈페이지 프로젝트의 기능 요구사항을 정의한다.
새 요구사항이 추가/변경되면 본 문서를 먼저 갱신한 뒤 구현한다.

---

## A. 공개 영역 (고객용)

### 디자인 참고
- 레퍼런스: https://romentordesign.com/aboutcorp
- 분위기: 미니멀·세련, 컨텐츠 중심, 화이트 기반 + 절제된 타이포그래피
- 디자인 시스템 정의는 Phase 9에서 본격 적용

### 메인 네비게이션 (확정)
- **Home / About us / Project / Process / Contact / Blog / Instagram**
- Project는 드롭다운 또는 서브 탭으로 **주거공간 / 상업공간** 두 갈래로 분기
- Instagram은 외부 링크 (새 탭)
- **제외:** Youtube, Press, Board

### A-1. Home (`/`)
- 히어로 배너 (대표 이미지 + 슬로건)
- 추천 포트폴리오 미리보기 (주거/상업 각 일부 노출)
- 회사 짧은 소개 + 문의 유도 CTA

### A-2. About us (`/about`)
- 인사말, 회사 철학, 연혁, 연락처
- 1차 구현은 정적 콘텐츠로 충분

### A-3. Project
공통 포트폴리오 데이터를 **주거공간 / 상업공간 카테고리로 분리 노출**.

#### A-3-1. 주거공간 목록 (`/project/residential`)
- 카드 그리드 (대표 이미지, 제목, 위치/평수 등)
- 정렬: 최신순(기본)
- 페이지네이션 또는 무한 스크롤
- 태그 필터(선택, 추후)

#### A-3-2. 상업공간 목록 (`/project/commercial`)
- 위와 동일 구조, 상업공간 카테고리만 노출

#### A-3-3. 포트폴리오 상세 (`/project/[id]`)
- 다중 이미지 갤러리 (썸네일 + 라이트박스)
- 제목, 카테고리(주거/상업), 위치, 평수, 공사기간, 설명
- 이전/다음 포트폴리오 이동(같은 카테고리 내)

### A-4. Process (`/process`)
- 상담 → 현장 실측 → 디자인 제안 → 시공 → A/S 등 단계별 설명
- 1차 구현은 정적 콘텐츠

### A-5. Contact (`/contact`)
- 폼 필드: 이름, 연락처, 이메일(선택), 문의 내용, 개인정보 동의 체크
- 제출 시:
  1. DB에 저장
  2. 사장님 이메일로 알림 발송
  3. 사용자에게 완료 안내
- 회사 위치/연락처/영업시간 정보 병행 노출

### A-6. Blog (PENDING — 1차 범위 제외)
- 추후 별도 Phase로 도입 예정. 메뉴 노출도 보류.

### A-7. Instagram
- 별도 페이지 없음. 헤더의 외부 링크로만 처리.

---

## B. 관리자 영역 (사장님 전용)

> **모든 관리자 API/페이지는 JWT 인증 필수.** 비인증 접근 시 404 또는 401 응답.

### B-1. 로그인 (`/admin/login`)
- 아이디 + 비밀번호 입력
- 성공 시 JWT 발급 (HttpOnly 쿠키 권장)
- 실패 시 일반화된 메시지("로그인 정보가 올바르지 않습니다")

### B-2. 대시보드 (`/admin`)
- 포트폴리오 총 개수
- 미확인 문의 개수
- 최근 문의 5건

### B-3. 포트폴리오 관리 (`/admin/portfolio`)
- 목록 조회 (관리자용, 비공개 항목 포함)
- 신규 등록:
  - 제목, 카테고리, 태그, 위치, 평수, 공사기간, 설명
  - 이미지 다중 업로드, 순서 변경, 대표 이미지 지정
  - 공개 여부 토글
- 수정 / 삭제

### B-4. 문의 관리 (`/admin/inquiries`)
- 문의 목록 (페이지네이션)
- 상태: 미확인 / 확인됨 / 처리완료
- 상세 보기, 상태 변경, 삭제

### B-5. Blog 관리 (PENDING)
- 1차 범위 제외. 추후 도입.

### B-6. (추후) 회사 소개 / Process 편집
- 1차 범위에서 제외. 코드 내 정적 콘텐츠로 시작. MVP 이후 CMS화 고려.

### B-인증 (1차 최소 형태)
- 1차 MVP에서는 Spring Security/JWT를 사용하지 않음.
- 환경변수에 저장된 단일 비밀번호로 관리자 로그인 처리.
- 로그인 성공 시 단순 토큰(예: HMAC 서명된 쿠키 또는 서버 세션)으로 보호.
- 정식 인증은 별도 Phase에서 Spring Security + JWT로 교체.

---

## C. 데이터 모델 (초안)

### Portfolio
| 필드 | 타입 | 비고 |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | |
| title | VARCHAR | |
| category | ENUM | **RESIDENTIAL / COMMERCIAL** (둘로 한정) |
| location | VARCHAR | nullable |
| area_size | VARCHAR | "32평" 등 자유 텍스트 |
| duration | VARCHAR | "2주" 등 |
| description | TEXT | |
| is_published | BOOLEAN | 기본 true |
| created_at / updated_at | TIMESTAMP | |

### PortfolioImage
| 필드 | 타입 | 비고 |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | |
| portfolio_id | FK | |
| file_path | VARCHAR | 저장 경로 |
| display_order | INT | 정렬용 |
| is_thumbnail | BOOLEAN | 대표 이미지 |

### Inquiry
| 필드 | 타입 | 비고 |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | |
| name | VARCHAR | |
| phone | VARCHAR | |
| email | VARCHAR | nullable |
| content | TEXT | |
| status | ENUM | NEW / CHECKED / DONE |
| created_at | TIMESTAMP | |

### AdminUser
| 필드 | 타입 | 비고 |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | |
| username | VARCHAR UNIQUE | |
| password_hash | VARCHAR | BCrypt |
| email | VARCHAR | 알림 수신용 |

### BlogPost
| 필드 | 타입 | 비고 |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | |
| title | VARCHAR | |
| content | TEXT | 마크다운 또는 HTML |
| thumbnail_path | VARCHAR | nullable |
| is_published | BOOLEAN | 기본 true |
| created_at / updated_at | TIMESTAMP | |

---

## D. 비기능 요구사항

- **반응형 (필수):** 모바일 / 태블릿(아이패드) / PC 모두에서 자연스럽게 보여야 함
  - 모바일 우선(Mobile-first) Tailwind 브레이크포인트 활용
  - 권장 브레이크포인트: `sm 640 / md 768(태블릿) / lg 1024 / xl 1280`
  - 헤더는 데스크탑에서 가로 메뉴, 태블릿/모바일에서는 햄버거 메뉴로 전환
  - 포트폴리오 그리드 컬럼: 모바일 1열 / 태블릿 2열 / 데스크탑 3~4열
  - 이미지는 `sizes` 속성 + Next/Image로 디바이스별 최적 해상도 제공
  - 터치 친화: 라이트박스 스와이프 제스처 지원
  - 실기기 또는 DevTools에서 iPhone / iPad / 데스크탑 시나리오 점검
- **SEO:** 공개 페이지는 SSR 또는 SSG, 메타태그/OG 태그 적용
- **이미지 최적화:** Next/Image 활용, 썸네일 분리 저장 고려
- **접근성:** 시맨틱 태그, alt 텍스트 필수
- **로깅:** 백엔드 요청/에러 로그
- **i18n:** 미지원 (한국어 전용)

---

## E. 변경 이력

| 일자 | 변경 내용 |
|---|---|
| 2026-05-16 | 초안 작성 |
| 2026-05-16 | 디자인 레퍼런스(romentordesign.com) 반영, 메뉴 확정(Home/About/Project/Process/Contact/Blog/Instagram), Youtube/Press/Board 제외, Project를 주거/상업 2개 카테고리로 분리, Blog 관리 기능 추가, 반응형(모바일/태블릿/PC) 필수 명시 |
