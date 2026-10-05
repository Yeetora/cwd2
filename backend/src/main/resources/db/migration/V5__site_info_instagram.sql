-- 헤더 Instagram 링크를 관리자 사이트 설정에서 변경할 수 있도록 컬럼 추가
-- 비어 있으면 헤더에서 Instagram 메뉴를 숨김

ALTER TABLE site_info
    ADD COLUMN instagram_url VARCHAR(500) DEFAULT NULL;
