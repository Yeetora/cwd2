package com.chaeuda.siteinfo.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SiteInfoUpdateRequest(
        @Size(max = 50) String companyPhone,
        @Size(max = 255) String companyEmail,
        @Size(max = 500) String companyAddress,
        @Size(max = 200) String businessHours,
        @Size(max = 500)
        @Pattern(regexp = "^\\s*$|^https?://\\S+$", message = "http:// 또는 https://로 시작하는 주소를 입력해 주세요")
        String instagramUrl
) {
}
