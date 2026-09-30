package com.chaeuda.inquiry.dto;

import com.chaeuda.inquiry.domain.InquiryStatus;
import jakarta.validation.constraints.NotNull;

public record InquiryStatusUpdateRequest(@NotNull InquiryStatus status) {
}
