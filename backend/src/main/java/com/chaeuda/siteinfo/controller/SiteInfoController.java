package com.chaeuda.siteinfo.controller;

import com.chaeuda.siteinfo.dto.SiteInfoResponse;
import com.chaeuda.siteinfo.service.SiteInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/site-info")
@RequiredArgsConstructor
public class SiteInfoController {

    private final SiteInfoService siteInfoService;

    @GetMapping
    public SiteInfoResponse get() {
        return siteInfoService.get();
    }
}
