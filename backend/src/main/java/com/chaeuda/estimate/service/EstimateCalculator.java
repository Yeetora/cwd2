package com.chaeuda.estimate.service;

import com.chaeuda.estimate.domain.EstimateOption;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * 견적 계산 (순수 함수). 금액 단위는 원, 결과는 만원 단위 반올림.
 */
public final class EstimateCalculator {

    static final long ROUND_UNIT = 10_000L;

    private EstimateCalculator() {
    }

    public record OptionInput(EstimateOption option, int quantity) {
    }

    public record Line(String label, String formula, long amount) {
    }

    public record Result(long subtotal, long amount, long minAmount, long maxAmount,
                         boolean minimumApplied, List<Line> lines) {
    }

    public static Result calculate(BigDecimal areaPyeong, long pricePerPyeong, List<OptionInput> options,
                                   int rangePercent, Long minimumAmount) {
        List<Line> lines = new ArrayList<>();

        long base = multiply(areaPyeong, pricePerPyeong);
        lines.add(new Line("기본 공사", area(areaPyeong) + "평 × " + won(pricePerPyeong), base));

        long subtotal = base;
        for (OptionInput in : options) {
            EstimateOption o = in.option();
            long optionAmount;
            String formula;
            switch (o.getPricingType()) {
                case PER_PYEONG -> {
                    optionAmount = multiply(areaPyeong, o.getUnitPrice());
                    formula = area(areaPyeong) + "평 × " + won(o.getUnitPrice());
                }
                case PER_UNIT -> {
                    optionAmount = o.getUnitPrice() * in.quantity();
                    String unit = o.getUnitLabel() == null || o.getUnitLabel().isBlank() ? "개" : o.getUnitLabel();
                    formula = in.quantity() + unit + " × " + won(o.getUnitPrice());
                }
                default -> {
                    optionAmount = o.getUnitPrice();
                    formula = "고정";
                }
            }
            lines.add(new Line(o.getName(), formula, optionAmount));
            subtotal += optionAmount;
        }

        boolean minimumApplied = minimumAmount != null && subtotal < minimumAmount;
        long total = minimumApplied ? minimumAmount : subtotal;

        long amount = roundToUnit(total);
        long min = roundToUnit(total * (100L - rangePercent) / 100);
        long max = roundToUnit(total * (100L + rangePercent) / 100);
        return new Result(subtotal, amount, min, max, minimumApplied, List.copyOf(lines));
    }

    static long roundToUnit(long value) {
        return BigDecimal.valueOf(value)
                .divide(BigDecimal.valueOf(ROUND_UNIT), 0, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(ROUND_UNIT))
                .longValueExact();
    }

    private static long multiply(BigDecimal area, long price) {
        return area.multiply(BigDecimal.valueOf(price)).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    static String area(BigDecimal area) {
        return area.stripTrailingZeros().toPlainString();
    }

    static String won(long amount) {
        return String.format("%,d원", amount);
    }
}
