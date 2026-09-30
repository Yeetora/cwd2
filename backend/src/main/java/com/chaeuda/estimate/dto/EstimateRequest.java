package com.chaeuda.estimate.dto;

import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.portfolio.domain.Category;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record EstimateRequest(
        @NotNull Category category,
        @NotNull Grade grade,
        @NotNull @DecimalMin("1") @DecimalMax("1000") @Digits(integer = 4, fraction = 1) BigDecimal areaPyeong,
        @Size(max = 50) List<@Valid @NotNull OptionSelection> options
) {
}
