package com.chaeuda.siteinfo.dto;

public record SiteInfoResponse(
        String companyPhone,
        String companyEmail,
        String companyAddress,
        String businessHours,
        String heroImageUrl,
        String residentialHeroUrl,
        String commercialHeroUrl
) {
}
