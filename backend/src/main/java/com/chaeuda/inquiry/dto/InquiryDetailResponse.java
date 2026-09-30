package com.chaeuda.inquiry.dto;

import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.inquiry.domain.Inquiry;
import com.chaeuda.inquiry.domain.InquiryStatus;
import com.chaeuda.portfolio.domain.Category;

import java.math.BigDecimal;
import java.time.Instant;

public record InquiryDetailResponse(
        Long id,
        String name,
        String phone,
        String email,
        String content,
        InquiryStatus status,
        Instant createdAt,
        Estimate estimate
) {
    public record Estimate(
            Category category,
            Grade grade,
            BigDecimal areaPyeong,
            Long amount,
            Long minAmount,
            Long maxAmount,
            String detail
    ) {
    }

    public static InquiryDetailResponse from(Inquiry i) {
        Estimate estimate = i.getEstimateAmount() == null ? null : new Estimate(
                i.getEstimateCategory(), i.getEstimateGrade(), i.getEstimateArea(),
                i.getEstimateAmount(), i.getEstimateMin(), i.getEstimateMax(), i.getEstimateDetail());
        return new InquiryDetailResponse(i.getId(), i.getName(), i.getPhone(), i.getEmail(), i.getContent(),
                i.getStatus(), i.getCreatedAt(), estimate);
    }
}
