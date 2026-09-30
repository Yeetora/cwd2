package com.chaeuda.estimate.controller;

import com.chaeuda.estimate.dto.AdminEstimateConfigResponse;
import com.chaeuda.estimate.dto.BaseRatesUpdateRequest;
import com.chaeuda.estimate.dto.EstimateOptionRequest;
import com.chaeuda.estimate.dto.EstimateOptionResponse;
import com.chaeuda.estimate.dto.EstimateSettingsUpdateRequest;
import com.chaeuda.estimate.service.EstimateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/estimate")
@RequiredArgsConstructor
public class AdminEstimateController {

    private final EstimateService estimateService;

    @GetMapping
    public AdminEstimateConfigResponse get() {
        return estimateService.getAdminConfig();
    }

    @PutMapping("/settings")
    public AdminEstimateConfigResponse updateSettings(@Valid @RequestBody EstimateSettingsUpdateRequest request) {
        return estimateService.updateSettings(request);
    }

    @PutMapping("/rates")
    public AdminEstimateConfigResponse updateRates(@Valid @RequestBody BaseRatesUpdateRequest request) {
        return estimateService.updateRates(request);
    }

    @PostMapping("/options")
    @ResponseStatus(HttpStatus.CREATED)
    public EstimateOptionResponse createOption(@Valid @RequestBody EstimateOptionRequest request) {
        return estimateService.createOption(request);
    }

    @PutMapping("/options/{id}")
    public EstimateOptionResponse updateOption(@PathVariable Long id, @Valid @RequestBody EstimateOptionRequest request) {
        return estimateService.updateOption(id, request);
    }

    @DeleteMapping("/options/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOption(@PathVariable Long id) {
        estimateService.deleteOption(id);
    }
}
