-- 예상 견적 기능: 관리자 설정(단일 행) + 평당 단가 + 옵션 항목, 문의에 견적 스냅샷 컬럼 추가

CREATE TABLE estimate_settings (
    id             BIGINT        NOT NULL,
    enabled        BIT(1)        NOT NULL,
    display_mode   ENUM('RANGE','SINGLE') NOT NULL,
    range_percent  INT           NOT NULL,
    minimum_amount BIGINT        DEFAULT NULL,
    notice         VARCHAR(1000) DEFAULT NULL,
    updated_at     DATETIME(6)   NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO estimate_settings (id, enabled, display_mode, range_percent, minimum_amount, notice, updated_at)
VALUES (1, b'0', 'RANGE', 10, NULL, '현장 실측과 자재 선택에 따라 실제 견적은 달라질 수 있습니다.', NOW(6));

CREATE TABLE estimate_base_rate (
    id               BIGINT NOT NULL AUTO_INCREMENT,
    category         ENUM('RESIDENTIAL','COMMERCIAL') NOT NULL,
    grade            ENUM('BASIC','STANDARD','PREMIUM') NOT NULL,
    price_per_pyeong BIGINT DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_estimate_base_rate_category_grade (category, grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO estimate_base_rate (category, grade, price_per_pyeong) VALUES
    ('RESIDENTIAL', 'BASIC', NULL),
    ('RESIDENTIAL', 'STANDARD', NULL),
    ('RESIDENTIAL', 'PREMIUM', NULL),
    ('COMMERCIAL', 'BASIC', NULL),
    ('COMMERCIAL', 'STANDARD', NULL),
    ('COMMERCIAL', 'PREMIUM', NULL);

CREATE TABLE estimate_option (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(300) DEFAULT NULL,
    applies_to    ENUM('ALL','RESIDENTIAL','COMMERCIAL') NOT NULL,
    pricing_type  ENUM('PER_PYEONG','PER_UNIT','FIXED') NOT NULL,
    unit_price    BIGINT       NOT NULL,
    unit_label    VARCHAR(20)  DEFAULT NULL,
    active        BIT(1)       NOT NULL,
    display_order INT          NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    KEY ix_estimate_option_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE inquiry
    ADD COLUMN estimate_category ENUM('RESIDENTIAL','COMMERCIAL') DEFAULT NULL,
    ADD COLUMN estimate_grade    ENUM('BASIC','STANDARD','PREMIUM') DEFAULT NULL,
    ADD COLUMN estimate_area     DECIMAL(7,1) DEFAULT NULL,
    ADD COLUMN estimate_amount   BIGINT       DEFAULT NULL,
    ADD COLUMN estimate_min      BIGINT       DEFAULT NULL,
    ADD COLUMN estimate_max      BIGINT       DEFAULT NULL,
    ADD COLUMN estimate_detail   TEXT;
