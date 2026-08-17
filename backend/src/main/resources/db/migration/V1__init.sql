-- 초기 스키마 (Hibernate ddl-auto=update가 생성한 구조 기반)
-- 이후 변경은 V2__*.sql, V3__*.sql 같은 새 파일로 추가

CREATE TABLE admin_user (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_user_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE portfolio (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    title         VARCHAR(200) NOT NULL,
    category      ENUM('RESIDENTIAL','COMMERCIAL') NOT NULL,
    location      VARCHAR(200) DEFAULT NULL,
    area_size     VARCHAR(50)  DEFAULT NULL,
    duration      VARCHAR(50)  DEFAULT NULL,
    description   TEXT,
    is_published  BIT(1)       NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    KEY ix_portfolio_category_created_at (category, created_at),
    KEY ix_portfolio_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE portfolio_image (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    portfolio_id  BIGINT       NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    original_name VARCHAR(255) DEFAULT NULL,
    display_order INT          NOT NULL,
    is_thumbnail  BIT(1)       NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    KEY ix_portfolio_image_portfolio_order (portfolio_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inquiry (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    phone      VARCHAR(30)  NOT NULL,
    email      VARCHAR(255) DEFAULT NULL,
    content    TEXT         NOT NULL,
    status     ENUM('NEW','CHECKED','DONE') NOT NULL,
    created_at DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    KEY ix_inquiry_status_created_at (status, created_at),
    KEY ix_inquiry_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
