package com.chaeuda.estimate.dto;

import com.chaeuda.estimate.domain.DisplayMode;

public record EstimateResultResponse(
        DisplayMode displayMode,
        long amount,
        long minAmount,
        long maxAmount,
        String notice
) {
}
