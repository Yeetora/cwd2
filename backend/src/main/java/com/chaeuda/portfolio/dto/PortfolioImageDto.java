package com.chaeuda.portfolio.dto;

public record PortfolioImageDto(
        Long id,
        String url,
        String originalName,
        int displayOrder,
        boolean isThumbnail
) {
}
