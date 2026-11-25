-- 관리자 사이트 설정에서 업로드하는 사이트 로고 (헤더/푸터/관리자 화면)
-- 비어 있으면 프런트의 기본 로고(/logo.png)를 사용

ALTER TABLE site_info
    ADD COLUMN logo_path VARCHAR(500) DEFAULT NULL;
