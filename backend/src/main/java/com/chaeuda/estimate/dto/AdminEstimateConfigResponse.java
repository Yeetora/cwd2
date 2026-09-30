package com.chaeuda.estimate.dto;

import com.chaeuda.estimate.domain.DisplayMode;

import java.util.List;

public record AdminEstimateConfigResponse(
        Settings settings,
        List<BaseRateItem> rates,
        List<EstimateOptionResponse> options
) {
    public record Settings(
            boolean enabled,
            DisplayMode displayMode,
            int rangePercent,
            Long minimumAmount,
            String notice
    ) {
    }
}
