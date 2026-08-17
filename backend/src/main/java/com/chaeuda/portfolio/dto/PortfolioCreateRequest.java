package com.chaeuda.portfolio.dto;

import com.chaeuda.portfolio.domain.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PortfolioCreateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull Category category,
        @Size(max = 200) String location,
        @Size(max = 50) String areaSize,
        @Size(max = 50) String duration,
        @Size(max = 10000) String description,
        Boolean isPublished
) {
    public boolean isPublishedOrDefault() {
        return isPublished == null || isPublished;
    }
}
