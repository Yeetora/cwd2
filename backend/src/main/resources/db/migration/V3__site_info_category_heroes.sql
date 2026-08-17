-- /project 페이지의 주거/상업 카테고리 카드용 히어로 이미지 경로 추가

ALTER TABLE site_info
    ADD COLUMN residential_hero_path VARCHAR(500) DEFAULT NULL,
    ADD COLUMN commercial_hero_path  VARCHAR(500) DEFAULT NULL;
