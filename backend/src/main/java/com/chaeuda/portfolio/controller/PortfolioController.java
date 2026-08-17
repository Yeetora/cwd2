package com.chaeuda.portfolio.controller;

import com.chaeuda.common.dto.PageResponse;
import com.chaeuda.portfolio.domain.Category;
import com.chaeuda.portfolio.dto.AdjacentResponse;
import com.chaeuda.portfolio.dto.PortfolioDetailResponse;
import com.chaeuda.portfolio.dto.PortfolioListItem;
import com.chaeuda.portfolio.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private static final int MAX_PAGE_SIZE = 100;

    private final PortfolioService portfolioService;

    @GetMapping
    public PageResponse<PortfolioListItem> list(
            @RequestParam Category category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return portfolioService.publicList(category, Math.max(0, page), clamp(size));
    }

    @GetMapping("/{id}")
    public PortfolioDetailResponse detail(@PathVariable Long id) {
        return portfolioService.publicDetail(id);
    }

    @GetMapping("/{id}/adjacent")
    public AdjacentResponse adjacent(@PathVariable Long id, @RequestParam Category category) {
        return portfolioService.publicAdjacent(id, category);
    }

    private int clamp(int size) {
        if (size < 1) return 1;
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
