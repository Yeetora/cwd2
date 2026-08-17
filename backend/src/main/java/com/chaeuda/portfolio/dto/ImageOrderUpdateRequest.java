package com.chaeuda.portfolio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ImageOrderUpdateRequest(
        @NotEmpty @Valid List<Entry> orders
) {
    public record Entry(
            @NotNull Long imageId,
            @Min(0) int order
    ) {}
}
