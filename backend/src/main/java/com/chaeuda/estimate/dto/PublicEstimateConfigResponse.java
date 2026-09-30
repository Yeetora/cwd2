package com.chaeuda.estimate.dto;

import com.chaeuda.estimate.domain.AppliesTo;
import com.chaeuda.estimate.domain.DisplayMode;
import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.estimate.domain.PricingType;
import com.chaeuda.portfolio.domain.Category;

import java.util.List;

/** 고객용 설정 — 단가는 포함하지 않는다. */
public record PublicEstimateConfigResponse(
        boolean enabled,
        DisplayMode displayMode,
        String notice,
        List<CategoryGrades> categories,
        List<PublicOption> options
) {
    public record CategoryGrades(Category category, List<GradeItem> grades) {
    }

    public record GradeItem(Grade grade, String label) {
    }

    public record PublicOption(
            Long id,
            String name,
            String description,
            AppliesTo appliesTo,
            PricingType pricingType,
            String unitLabel
    ) {
    }
}
