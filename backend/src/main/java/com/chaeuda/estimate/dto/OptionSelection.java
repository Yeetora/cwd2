package com.chaeuda.estimate.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OptionSelection(
        @NotNull Long optionId,
        /** 개수형 옵션에서만 사용. 그 외는 무시 */
        @Min(1) @Max(99) Integer quantity
) {
}
