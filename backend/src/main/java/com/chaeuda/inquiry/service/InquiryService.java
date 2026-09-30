package com.chaeuda.inquiry.service;

import com.chaeuda.common.dto.PageResponse;
import com.chaeuda.common.exception.ApiException;
import com.chaeuda.estimate.service.EstimateService;
import com.chaeuda.inquiry.domain.Inquiry;
import com.chaeuda.inquiry.domain.InquiryStatus;
import com.chaeuda.inquiry.dto.InquiryCreateRequest;
import com.chaeuda.inquiry.dto.InquiryCreatedResponse;
import com.chaeuda.inquiry.dto.InquiryDetailResponse;
import com.chaeuda.inquiry.dto.InquiryListItem;
import com.chaeuda.inquiry.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryService {

    private static final int MAX_PAGE_SIZE = 100;

    private final InquiryRepository inquiryRepository;
    private final EstimateService estimateService;

    @Transactional
    public InquiryCreatedResponse create(InquiryCreateRequest req) {
        // 숨김 필드가 채워졌으면 봇으로 보고 저장하지 않되, 봇이 눈치채지 못하게 성공처럼 응답
        if (req.website() != null && !req.website().isBlank()) {
            log.info("Inquiry honeypot triggered, dropped");
            return new InquiryCreatedResponse(null, null);
        }

        String content = req.content() == null ? "" : req.content().trim();
        if (content.isEmpty() && req.estimate() == null) {
            throw ApiException.badRequest("문의 내용을 입력해 주세요");
        }

        Inquiry.InquiryBuilder builder = Inquiry.builder()
                .name(req.name().trim())
                .phone(req.phone().trim())
                .email(req.email() == null || req.email().isBlank() ? null : req.email().trim())
                .content(content);

        EstimateService.Calculation calc = null;
        if (req.estimate() != null) {
            calc = estimateService.calculate(req.estimate());
            builder.estimateCategory(calc.category())
                    .estimateGrade(calc.grade())
                    .estimateArea(calc.areaPyeong())
                    .estimateAmount(calc.result().amount())
                    .estimateMin(calc.result().minAmount())
                    .estimateMax(calc.result().maxAmount())
                    .estimateDetail(calc.detail());
        }

        Inquiry saved = inquiryRepository.save(builder.build());
        return new InquiryCreatedResponse(saved.getId(), calc == null ? null : calc.toResponse());
    }

    public PageResponse<InquiryListItem> list(InquiryStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        Page<Inquiry> result = status == null
                ? inquiryRepository.findAllByOrderByCreatedAtDesc(pageable)
                : inquiryRepository.findAllByStatusOrderByCreatedAtDesc(status, pageable);
        return PageResponse.from(result.map(InquiryListItem::from));
    }

    public InquiryDetailResponse get(Long id) {
        return InquiryDetailResponse.from(find(id));
    }

    @Transactional
    public InquiryDetailResponse updateStatus(Long id, InquiryStatus status) {
        Inquiry inquiry = find(id);
        inquiry.changeStatus(status);
        return InquiryDetailResponse.from(inquiry);
    }

    @Transactional
    public void delete(Long id) {
        inquiryRepository.delete(find(id));
    }

    private Inquiry find(Long id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("문의를 찾을 수 없습니다"));
    }
}
