package com.chaeuda.siteinfo.dto;

/** 폰트 키 (프런트 lib/fonts.ts 목록과 동일). null/빈 값은 기본 폰트 */
public record SiteFontsUpdateRequest(
        String fontHeading,
        String fontBody
) {
}
