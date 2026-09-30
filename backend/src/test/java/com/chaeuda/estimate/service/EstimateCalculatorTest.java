package com.chaeuda.estimate.service;

import com.chaeuda.estimate.domain.AppliesTo;
import com.chaeuda.estimate.domain.EstimateOption;
import com.chaeuda.estimate.domain.PricingType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EstimateCalculatorTest {

    @Test
    void base_only_is_area_times_rate() {
        EstimateCalculator.Result r = EstimateCalculator.calculate(
                new BigDecimal("32"), 1_500_000L, List.of(), 10, null);

        assertThat(r.subtotal()).isEqualTo(48_000_000L);
        assertThat(r.amount()).isEqualTo(48_000_000L);
        assertThat(r.minAmount()).isEqualTo(43_200_000L);
        assertThat(r.maxAmount()).isEqualTo(52_800_000L);
        assertThat(r.minimumApplied()).isFalse();
        assertThat(r.lines()).hasSize(1);
        assertThat(r.lines().get(0).formula()).isEqualTo("32평 × 1,500,000원");
    }

    @Test
    void options_are_added_by_pricing_type() {
        EstimateOption perPyeong = option("바닥 교체", PricingType.PER_PYEONG, 100_000L, null);
        EstimateOption perUnit = option("실링팬", PricingType.PER_UNIT, 350_000L, "대");
        EstimateOption fixed = option("철거", PricingType.FIXED, 2_000_000L, null);

        EstimateCalculator.Result r = EstimateCalculator.calculate(
                new BigDecimal("20.5"), 1_000_000L,
                List.of(new EstimateCalculator.OptionInput(perPyeong, 1),
                        new EstimateCalculator.OptionInput(perUnit, 2),
                        new EstimateCalculator.OptionInput(fixed, 1)),
                0, null);

        // 20,500,000 + 2,050,000 + 700,000 + 2,000,000
        assertThat(r.subtotal()).isEqualTo(25_250_000L);
        assertThat(r.amount()).isEqualTo(25_250_000L);
        assertThat(r.minAmount()).isEqualTo(r.amount());
        assertThat(r.maxAmount()).isEqualTo(r.amount());
        assertThat(r.lines()).extracting(EstimateCalculator.Line::formula)
                .containsExactly("20.5평 × 1,000,000원", "20.5평 × 100,000원", "2대 × 350,000원", "고정");
    }

    @Test
    void minimum_amount_applies_when_subtotal_is_lower() {
        EstimateCalculator.Result r = EstimateCalculator.calculate(
                new BigDecimal("3"), 1_000_000L, List.of(), 10, 10_000_000L);

        assertThat(r.subtotal()).isEqualTo(3_000_000L);
        assertThat(r.minimumApplied()).isTrue();
        assertThat(r.amount()).isEqualTo(10_000_000L);
        assertThat(r.minAmount()).isEqualTo(9_000_000L);
        assertThat(r.maxAmount()).isEqualTo(11_000_000L);
    }

    @Test
    void results_are_rounded_to_ten_thousand_won() {
        EstimateCalculator.Result r = EstimateCalculator.calculate(
                new BigDecimal("1"), 1_234_567L, List.of(), 7, null);

        assertThat(r.amount()).isEqualTo(1_230_000L);
        assertThat(r.minAmount() % 10_000).isZero();
        assertThat(r.maxAmount() % 10_000).isZero();
    }

    @Test
    void round_to_unit_is_half_up() {
        assertThat(EstimateCalculator.roundToUnit(14_999L)).isEqualTo(10_000L);
        assertThat(EstimateCalculator.roundToUnit(15_000L)).isEqualTo(20_000L);
    }

    private static EstimateOption option(String name, PricingType type, long price, String unitLabel) {
        return EstimateOption.builder()
                .name(name)
                .appliesTo(AppliesTo.ALL)
                .pricingType(type)
                .unitPrice(price)
                .unitLabel(unitLabel)
                .active(true)
                .displayOrder(0)
                .build();
    }
}
