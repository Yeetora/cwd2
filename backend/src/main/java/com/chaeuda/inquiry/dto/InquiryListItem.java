package com.chaeuda.inquiry.dto;

import com.chaeuda.inquiry.domain.Inquiry;
import com.chaeuda.inquiry.domain.InquiryStatus;

import java.time.Instant;

public record InquiryListItem(
        Long id,
        String name,
        String phone,
        InquiryStatus status,
        boolean hasEstimate,
        Long estimateAmount,
        Instant createdAt
) {
    public static InquiryListItem from(Inquiry i) {
        return new InquiryListItem(i.getId(), i.getName(), i.getPhone(), i.getStatus(),
                i.getEstimateAmount() != null, i.getEstimateAmount(), i.getCreatedAt());
    }
}
