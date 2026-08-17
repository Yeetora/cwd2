package com.chaeuda.portfolio.controller;

import com.chaeuda.common.dto.PageResponse;
import com.chaeuda.portfolio.domain.Category;
import com.chaeuda.portfolio.dto.PortfolioCreateRequest;
import com.chaeuda.portfolio.dto.PortfolioDetailResponse;
import com.chaeuda.portfolio.dto.PortfolioListItem;
import com.chaeuda.portfolio.dto.PortfolioUpdateRequest;
import com.chaeuda.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/portfolios")
@RequiredArgsConstructor
public class AdminPortfolioController {

    private static final int MAX_PAGE_SIZE = 100;

    private final PortfolioService portfolioService;

    @GetMapping
    public PageResponse<PortfolioListItem> list(
            @RequestParam(required = false) Category category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return portfolioService.adminList(category, Math.max(0, page), clamp(size));
    }

    @GetMapping("/{id}")
    public PortfolioDetailResponse detail(@PathVariable Long id) {
        return portfolioService.adminDetail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PortfolioDetailResponse create(@Valid @RequestBody PortfolioCreateRequest request) {
        return portfolioService.create(request);
    }

    @PutMapping("/{id}")
    public PortfolioDetailResponse update(@PathVariable Long id,
                                          @Valid @RequestBody PortfolioUpdateRequest request) {
        return portfolioService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        portfolioService.delete(id);
    }

    private int clamp(int size) {
        if (size < 1) return 1;
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
