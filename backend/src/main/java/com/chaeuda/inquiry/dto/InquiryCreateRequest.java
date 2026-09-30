package com.chaeuda.inquiry.dto;

import com.chaeuda.estimate.dto.EstimateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InquiryCreateRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 30) String phone,
        @Email @Size(max = 255) String email,
        @Size(max = 5000) String content,
        @AssertTrue(message = "개인정보 수집 및 이용에 동의해 주세요") boolean privacyAgreed,
        /** 예상 견적과 함께 신청하는 경우. 서버에서 다시 계산해 저장한다. */
        @Valid EstimateRequest estimate,
        /** 스팸 방지용 숨김 필드 — 사람은 비워 둔다 */
        String website
) {
}
