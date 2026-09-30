package com.chaeuda.estimate.dto;

import com.chaeuda.estimate.domain.DisplayMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record EstimateSettingsUpdateRequest(
        boolean enabled,
        @NotNull DisplayMode displayMode,
        @Min(0) @Max(50) int rangePercent,
        @PositiveOrZero @Max(100_000_000_000L) Long minimumAmount,
        @Size(max = 1000) String notice
) {
}
