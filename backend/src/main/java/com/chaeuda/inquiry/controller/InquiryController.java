package com.chaeuda.inquiry.controller;

import com.chaeuda.inquiry.dto.InquiryCreateRequest;
import com.chaeuda.inquiry.dto.InquiryCreatedResponse;
import com.chaeuda.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InquiryCreatedResponse create(@Valid @RequestBody InquiryCreateRequest request) {
        return inquiryService.create(request);
    }
}
