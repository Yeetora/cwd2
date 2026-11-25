-- 관리자 사이트 설정에서 고르는 제목/본문 폰트 (프런트 폰트 목록의 키). 비어 있으면 기본 폰트

ALTER TABLE site_info
    ADD COLUMN font_heading VARCHAR(40) DEFAULT NULL,
    ADD COLUMN font_body    VARCHAR(40) DEFAULT NULL;
