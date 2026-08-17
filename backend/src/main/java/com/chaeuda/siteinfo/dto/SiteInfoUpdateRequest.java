package com.chaeuda.siteinfo.dto;

import jakarta.validation.constraints.Size;

public record SiteInfoUpdateRequest(
        @Size(max = 50) String companyPhone,
        @Size(max = 255) String companyEmail,
        @Size(max = 500) String companyAddress,
        @Size(max = 200) String businessHours
) {
}
