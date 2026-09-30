package com.chaeuda.estimate.dto;

import com.chaeuda.estimate.domain.AppliesTo;
import com.chaeuda.estimate.domain.PricingType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record EstimateOptionRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 300) String description,
        @NotNull AppliesTo appliesTo,
        @NotNull PricingType pricingType,
        @NotNull @PositiveOrZero @Max(10_000_000_000L) Long unitPrice,
        @Size(max = 20) String unitLabel,
        boolean active,
        @Min(0) @Max(9999) Integer displayOrder
) {
}
