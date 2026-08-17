package com.chaeuda.portfolio.dto;

import com.chaeuda.portfolio.domain.Category;

import java.time.Instant;

public record PortfolioListItem(
        Long id,
        String title,
        Category category,
        String location,
        String areaSize,
        String duration,
        boolean isPublished,
        Instant createdAt,
        String thumbnailUrl
) {
}
