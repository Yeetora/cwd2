package com.chaeuda.inquiry.dto;

import com.chaeuda.estimate.dto.EstimateResultResponse;

public record InquiryCreatedResponse(
        Long id,
        EstimateResultResponse estimate
) {
}
