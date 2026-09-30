package com.chaeuda.estimate.dto;

import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.portfolio.domain.Category;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record BaseRateItem(
        @NotNull Category category,
        @NotNull Grade grade,
        /** null 또는 0이면 해당 등급 미제공 */
        @PositiveOrZero @Max(1_000_000_000L) Long pricePerPyeong
) {
}
