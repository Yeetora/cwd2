package com.chaeuda.inquiry.controller;

import com.chaeuda.common.dto.PageResponse;
import com.chaeuda.inquiry.domain.InquiryStatus;
import com.chaeuda.inquiry.dto.InquiryDetailResponse;
import com.chaeuda.inquiry.dto.InquiryListItem;
import com.chaeuda.inquiry.dto.InquiryStatusUpdateRequest;
import com.chaeuda.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inquiries")
@RequiredArgsConstructor
public class AdminInquiryController {

    private final InquiryService inquiryService;

    @GetMapping
    public PageResponse<InquiryListItem> list(
            @RequestParam(required = false) InquiryStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return inquiryService.list(status, page, size);
    }

    @GetMapping("/{id}")
    public InquiryDetailResponse get(@PathVariable Long id) {
        return inquiryService.get(id);
    }

    @PutMapping("/{id}/status")
    public InquiryDetailResponse updateStatus(@PathVariable Long id, @Valid @RequestBody InquiryStatusUpdateRequest request) {
        return inquiryService.updateStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        inquiryService.delete(id);
    }
}
