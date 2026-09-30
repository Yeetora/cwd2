package com.chaeuda.estimate.dto;

import com.chaeuda.estimate.domain.AppliesTo;
import com.chaeuda.estimate.domain.DisplayMode;
import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.estimate.domain.PricingType;
import com.chaeuda.portfolio.domain.Category;

import java.util.List;

/** 고객용 설정 — 고객이 고르면서 금액을 볼 수 있도록 등급별 평당 단가와 옵션 단가를 포함한다. */
public record PublicEstimateConfigResponse(
        boolean enabled,
        DisplayMode displayMode,
        String notice,
        List<CategoryGrades> categories,
        List<PublicOption> options
) {
    public record CategoryGrades(Category category, List<GradeItem> grades) {
    }

    public record GradeItem(Grade grade, String label, long pricePerPyeong) {
    }

    public record PublicOption(
            Long id,
            String name,
            String description,
            AppliesTo appliesTo,
            PricingType pricingType,
            long unitPrice,
            String unitLabel
    ) {
    }
}
