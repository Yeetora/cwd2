-- 단일 행 사이트 설정 테이블
-- 운영자가 관리자 페이지에서 회사 정보(연락처/주소) 및 홈 히어로 이미지를 수정.

CREATE TABLE site_info (
    id              BIGINT       NOT NULL,
    company_phone   VARCHAR(50)  DEFAULT NULL,
    company_email   VARCHAR(255) DEFAULT NULL,
    company_address VARCHAR(500) DEFAULT NULL,
    business_hours  VARCHAR(200) DEFAULT NULL,
    hero_image_path VARCHAR(500) DEFAULT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 단일 행 (id=1) 강제 — 이후 조회/업데이트는 항상 이 행
INSERT INTO site_info (id, updated_at) VALUES (1, NOW(6));
