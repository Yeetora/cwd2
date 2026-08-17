package com.chaeuda.portfolio.dto;

import com.chaeuda.portfolio.domain.Category;

import java.time.Instant;
import java.util.List;

public record PortfolioDetailResponse(
        Long id,
        String title,
        Category category,
        String location,
        String areaSize,
        String duration,
        String description,
        boolean isPublished,
        Instant createdAt,
        Instant updatedAt,
        List<PortfolioImageDto> images
) {
}
