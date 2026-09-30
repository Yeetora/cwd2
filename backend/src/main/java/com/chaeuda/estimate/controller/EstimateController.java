package com.chaeuda.estimate.controller;

import com.chaeuda.estimate.dto.EstimateRequest;
import com.chaeuda.estimate.dto.EstimateResultResponse;
import com.chaeuda.estimate.dto.PublicEstimateConfigResponse;
import com.chaeuda.estimate.service.EstimateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/estimate")
@RequiredArgsConstructor
public class EstimateController {

    private final EstimateService estimateService;

    @GetMapping("/config")
    public PublicEstimateConfigResponse config() {
        return estimateService.getPublicConfig();
    }

    @PostMapping("/calculate")
    public EstimateResultResponse calculate(@Valid @RequestBody EstimateRequest request) {
        return estimateService.calculate(request).toResponse();
    }
}
