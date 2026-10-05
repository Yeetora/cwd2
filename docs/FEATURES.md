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
- 회사 위치/연락처/영업시간 정보 병행 노출 (사이트 설정 값 사용)

#### A-5-1. 예상 견적 (Contact 내 단계형)
- 관리자가 견적 기능을 켰고 평당 단가가 1개 이상 설정된 경우에만 노출
- 단계: ① 공간 유형(주거/상업)·마감 등급(기본/중급/고급)·평수 → ② 옵션 선택(관리자가 등록한 항목, 개수형은 수량 입력) → ③ 예상 견적 확인 → ④ 연락처 입력 후 상담 신청
- 견적은 연락처 없이 먼저 확인 가능. "견적 없이 바로 문의"도 가능
- 계산은 서버에서 수행 (단가표는 고객에게 노출하지 않음)
  - 기본 = 평수 × 평당 단가(유형·등급별)
  - 옵션 = 평당형(평수 × 단가) / 개수형(수량 × 단가) / 고정형(단가)
  - 합계가 최소 공사 금액보다 작으면 최소 금액 적용, 만원 단위 반올림
- 결과 표시 방식은 관리자 설정: 금액 범위(±%) 또는 단일 금액, 안내 문구
- 상담 신청 시 입력값과 계산 결과를 문의에 함께 저장 (이후 단가가 바뀌어도 당시 견적 보존)

### A-6. Blog (PENDING — 1차 범위 제외)
- 추후 별도 Phase로 도입 예정. 메뉴 노출도 보류.

### A-7. Instagram
- 별도 페이지 없음. 헤더의 외부 링크로만 처리.
- 링크 주소는 관리자 사이트 설정에서 변경. 비어 있으면 헤더에서 숨김.

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
- 견적과 함께 들어온 문의는 예상 견적 금액·선택 내역 표시

### B-4-1. 견적 설정 (`/admin/estimate`)
- 기본 설정: 사용 여부, 결과 표시 방식(범위/단일), 범위 폭(±%), 최소 공사 금액, 고객 안내 문구
- 평당 단가: 주거/상업 × 기본/중급/고급 (비워두면 해당 등급은 고객에게 미노출)
- 옵션 항목: 이름, 설명, 적용 공간(전체/주거/상업), 계산 방식(평당/개당/고정), 단가, 단위(예: 개), 사용 여부, 표시 순서
  - 관리자가 추가한 옵션(예: 실링팬)은 즉시 고객 견적 화면에 나타남

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
| estimate_category / estimate_grade | ENUM | 견적 포함 문의일 때만 |
| estimate_area | DECIMAL(7,1) | 평수 |
| estimate_amount / estimate_min / estimate_max | BIGINT | 신청 당시 계산 결과(원) |
| estimate_detail | TEXT | 신청 당시 단가·옵션 내역 스냅샷 |

### EstimateSettings (단일 행 id=1)
| 필드 | 타입 | 비고 |
|---|---|---|
| enabled | BOOLEAN | |
| display_mode | ENUM | RANGE / SINGLE |
| range_percent | INT | 범위 폭(±%) |
| minimum_amount | BIGINT | nullable |
| notice | VARCHAR | 고객 안내 문구 |

### EstimateBaseRate
| 필드 | 타입 | 비고 |
|---|---|---|
| category | ENUM | RESIDENTIAL / COMMERCIAL |
| grade | ENUM | BASIC / STANDARD / PREMIUM |
| price_per_pyeong | BIGINT | nullable = 미제공 |

### EstimateOption
| 필드 | 타입 | 비고 |
|---|---|---|
| name / description | VARCHAR | |
| applies_to | ENUM | ALL / RESIDENTIAL / COMMERCIAL |
| pricing_type | ENUM | PER_PYEONG / PER_UNIT / FIXED |
| unit_price | BIGINT | 원 |
| unit_label | VARCHAR | 개수형 단위 (예: 개) |
| active | BOOLEAN | |
| display_order | INT | |

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
| 2026-09-30 | Contact 예상 견적(A-5-1), 관리자 견적 설정(B-4-1), 문의 저장/관리 API 연결 |
| 2026-10-05 | Instagram 링크를 관리자 사이트 설정에서 변경 가능하게 (A-7) |
