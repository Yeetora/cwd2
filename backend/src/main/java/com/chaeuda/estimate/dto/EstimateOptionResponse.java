package com.chaeuda.estimate.dto;

import com.chaeuda.estimate.domain.AppliesTo;
import com.chaeuda.estimate.domain.EstimateOption;
import com.chaeuda.estimate.domain.PricingType;

public record EstimateOptionResponse(
        Long id,
        String name,
        String description,
        AppliesTo appliesTo,
        PricingType pricingType,
        long unitPrice,
        String unitLabel,
        boolean active,
        int displayOrder
) {
    public static EstimateOptionResponse from(EstimateOption o) {
        return new EstimateOptionResponse(o.getId(), o.getName(), o.getDescription(), o.getAppliesTo(),
                o.getPricingType(), o.getUnitPrice(), o.getUnitLabel(), o.isActive(), o.getDisplayOrder());
    }
}
