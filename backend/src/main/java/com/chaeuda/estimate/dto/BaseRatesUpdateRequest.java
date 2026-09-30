package com.chaeuda.estimate.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BaseRatesUpdateRequest(
        @NotNull @Size(max = 6) List<@Valid @NotNull BaseRateItem> rates
) {
}
