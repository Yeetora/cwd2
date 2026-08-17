package com.chaeuda.siteinfo.controller;

import com.chaeuda.portfolio.domain.Category;
import com.chaeuda.siteinfo.dto.SiteInfoResponse;
import com.chaeuda.siteinfo.dto.SiteInfoUpdateRequest;
import com.chaeuda.siteinfo.service.SiteInfoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/site-info")
@RequiredArgsConstructor
public class AdminSiteInfoController {

    private final SiteInfoService siteInfoService;

    @GetMapping
    public SiteInfoResponse get() {
        return siteInfoService.get();
    }

    @PutMapping
    public SiteInfoResponse update(@Valid @RequestBody SiteInfoUpdateRequest request) {
        return siteInfoService.update(request);
    }

    @PostMapping("/hero-image")
    public SiteInfoResponse uploadHero(@RequestParam("file") MultipartFile file) throws IOException {
        return siteInfoService.uploadHero(file);
    }

    @DeleteMapping("/hero-image")
    public SiteInfoResponse deleteHero() {
        return siteInfoService.deleteHero();
    }

    @PostMapping("/category-hero")
    public SiteInfoResponse uploadCategoryHero(
            @RequestParam("category") Category category,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return siteInfoService.uploadCategoryHero(category, file);
    }

    @DeleteMapping("/category-hero")
    public SiteInfoResponse deleteCategoryHero(@RequestParam("category") Category category) {
        return siteInfoService.deleteCategoryHero(category);
    }
}
