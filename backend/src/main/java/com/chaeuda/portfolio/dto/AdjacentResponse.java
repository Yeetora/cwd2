package com.chaeuda.portfolio.dto;

public record AdjacentResponse(
        Neighbor previous,
        Neighbor next
) {
    public record Neighbor(Long id, String title) {}
}
