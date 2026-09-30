package com.chaeuda.estimate.service;

import com.chaeuda.common.exception.ApiException;
import com.chaeuda.estimate.domain.DisplayMode;
import com.chaeuda.estimate.domain.EstimateBaseRate;
import com.chaeuda.estimate.domain.EstimateOption;
import com.chaeuda.estimate.domain.EstimateSettings;
import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.estimate.domain.PricingType;
import com.chaeuda.estimate.dto.AdminEstimateConfigResponse;
import com.chaeuda.estimate.dto.BaseRateItem;
import com.chaeuda.estimate.dto.BaseRatesUpdateRequest;
import com.chaeuda.estimate.dto.EstimateOptionRequest;
import com.chaeuda.estimate.dto.EstimateOptionResponse;
import com.chaeuda.estimate.dto.EstimateRequest;
import com.chaeuda.estimate.dto.EstimateResultResponse;
import com.chaeuda.estimate.dto.EstimateSettingsUpdateRequest;
import com.chaeuda.estimate.dto.OptionSelection;
import com.chaeuda.estimate.dto.PublicEstimateConfigResponse;
import com.chaeuda.estimate.dto.PublicEstimateConfigResponse.CategoryGrades;
import com.chaeuda.estimate.dto.PublicEstimateConfigResponse.GradeItem;
import com.chaeuda.estimate.dto.PublicEstimateConfigResponse.PublicOption;
import com.chaeuda.estimate.repository.EstimateBaseRateRepository;
import com.chaeuda.estimate.repository.EstimateOptionRepository;
import com.chaeuda.estimate.repository.EstimateSettingsRepository;
import com.chaeuda.portfolio.domain.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EstimateService {

    private final EstimateSettingsRepository settingsRepository;
    private final EstimateBaseRateRepository baseRateRepository;
    private final EstimateOptionRepository optionRepository;

    /** 문의 저장 시 스냅샷으로 남길 계산 결과 */
    public record Calculation(
            Category category,
            Grade grade,
            BigDecimal areaPyeong,
            EstimateCalculator.Result result,
            DisplayMode displayMode,
            String notice,
            String detail
    ) {
        public EstimateResultResponse toResponse() {
            return new EstimateResultResponse(displayMode, result.amount(), result.minAmount(),
                    result.maxAmount(), notice);
        }
    }

    // ── 고객용 ─────────────────────────────────────────

    public PublicEstimateConfigResponse getPublicConfig() {
        EstimateSettings settings = getOrInitSettings();
        List<EstimateBaseRate> rates = baseRateRepository.findAll();

        List<CategoryGrades> categories = new ArrayList<>();
        for (Category category : Category.values()) {
            List<GradeItem> grades = new ArrayList<>();
            for (Grade grade : Grade.values()) {
                boolean offered = rates.stream().anyMatch(r ->
                        r.getCategory() == category && r.getGrade() == grade && r.isOffered());
                if (offered) grades.add(new GradeItem(grade, grade.label()));
            }
            if (!grades.isEmpty()) categories.add(new CategoryGrades(category, grades));
        }

        boolean enabled = settings.isEnabled() && !categories.isEmpty();
        if (!enabled) {
            return new PublicEstimateConfigResponse(false, settings.getDisplayMode(), null, List.of(), List.of());
        }

        List<PublicOption> options = optionRepository.findAllByActiveTrueOrderByDisplayOrderAscIdAsc().stream()
                .map(o -> new PublicOption(o.getId(), o.getName(), o.getDescription(), o.getAppliesTo(),
                        o.getPricingType(), o.getUnitLabel()))
                .toList();
        return new PublicEstimateConfigResponse(true, settings.getDisplayMode(), settings.getNotice(),
                categories, options);
    }

    public Calculation calculate(EstimateRequest req) {
        EstimateSettings settings = getOrInitSettings();
        if (!settings.isEnabled()) {
            throw ApiException.badRequest("견적 기능이 비활성화되어 있습니다");
        }

        EstimateBaseRate rate = baseRateRepository.findByCategoryAndGrade(req.category(), req.grade())
                .filter(EstimateBaseRate::isOffered)
                .orElseThrow(() -> ApiException.badRequest("선택한 공간 유형/등급은 견적을 제공하지 않습니다"));

        List<EstimateCalculator.OptionInput> optionInputs = resolveOptions(req);

        EstimateCalculator.Result result = EstimateCalculator.calculate(
                req.areaPyeong(), rate.getPricePerPyeong(), optionInputs,
                settings.getRangePercent(), settings.getMinimumAmount());

        String detail = buildDetail(req, settings, result);
        return new Calculation(req.category(), req.grade(), req.areaPyeong(), result,
                settings.getDisplayMode(), settings.getNotice(), detail);
    }

    private List<EstimateCalculator.OptionInput> resolveOptions(EstimateRequest req) {
        List<OptionSelection> selections = req.options() == null ? List.of() : req.options();
        if (selections.isEmpty()) return List.of();

        Set<Long> seen = new HashSet<>();
        for (OptionSelection s : selections) {
            if (!seen.add(s.optionId())) {
                throw ApiException.badRequest("같은 옵션이 중복 선택되었습니다");
            }
        }

        Map<Long, EstimateOption> byId = optionRepository.findAllById(seen).stream()
                .collect(Collectors.toMap(EstimateOption::getId, Function.identity()));

        List<EstimateCalculator.OptionInput> inputs = new ArrayList<>();
        for (OptionSelection s : selections) {
            EstimateOption option = byId.get(s.optionId());
            if (option == null || !option.isActive() || !option.getAppliesTo().matches(req.category())) {
                throw ApiException.badRequest("선택할 수 없는 옵션이 포함되어 있습니다");
            }
            int quantity = 1;
            if (option.getPricingType() == PricingType.PER_UNIT) {
                if (s.quantity() == null) {
                    throw ApiException.badRequest("'" + option.getName() + "' 수량을 입력해 주세요");
                }
                quantity = s.quantity();
            }
            inputs.add(new EstimateCalculator.OptionInput(option, quantity));
        }
        return inputs;
    }

    private static String buildDetail(EstimateRequest req, EstimateSettings settings, EstimateCalculator.Result r) {
        StringBuilder sb = new StringBuilder();
        sb.append(req.category() == Category.RESIDENTIAL ? "주거" : "상업")
                .append(" · ").append(req.grade().label())
                .append(" · ").append(EstimateCalculator.area(req.areaPyeong())).append("평\n");
        for (EstimateCalculator.Line line : r.lines()) {
            sb.append("- ").append(line.label()).append(": ").append(line.formula())
                    .append(" = ").append(EstimateCalculator.won(line.amount())).append('\n');
        }
        sb.append("합계: ").append(EstimateCalculator.won(r.subtotal()));
        if (r.minimumApplied()) {
            sb.append(" → 최소 공사 금액 ").append(EstimateCalculator.won(settings.getMinimumAmount())).append(" 적용");
        }
        sb.append('\n');
        if (settings.getDisplayMode() == DisplayMode.RANGE) {
            sb.append("고객 표시: ").append(EstimateCalculator.won(r.minAmount()))
                    .append(" ~ ").append(EstimateCalculator.won(r.maxAmount()))
                    .append(" (±").append(settings.getRangePercent()).append("%)");
        } else {
            sb.append("고객 표시: ").append(EstimateCalculator.won(r.amount()));
        }
        return sb.toString();
    }

    // ── 관리자용 ───────────────────────────────────────

    @Transactional
    public AdminEstimateConfigResponse getAdminConfig() {
        EstimateSettings s = getOrInitSettings();
        List<EstimateBaseRate> rates = getOrInitRates();
        List<EstimateOptionResponse> options = optionRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .map(EstimateOptionResponse::from)
                .toList();
        return new AdminEstimateConfigResponse(
                new AdminEstimateConfigResponse.Settings(s.isEnabled(), s.getDisplayMode(), s.getRangePercent(),
                        s.getMinimumAmount(), s.getNotice()),
                rates.stream().map(r -> new BaseRateItem(r.getCategory(), r.getGrade(), r.getPricePerPyeong())).toList(),
                options);
    }

    @Transactional
    public AdminEstimateConfigResponse updateSettings(EstimateSettingsUpdateRequest req) {
        EstimateSettings s = getOrInitSettings();
        s.update(req.enabled(), req.displayMode(), req.rangePercent(), req.minimumAmount(), emptyToNull(req.notice()));
        settingsRepository.save(s);
        return getAdminConfig();
    }

    @Transactional
    public AdminEstimateConfigResponse updateRates(BaseRatesUpdateRequest req) {
        List<EstimateBaseRate> rates = getOrInitRates();
        for (BaseRateItem item : req.rates()) {
            EstimateBaseRate rate = rates.stream()
                    .filter(r -> r.getCategory() == item.category() && r.getGrade() == item.grade())
                    .findFirst()
                    .orElseThrow();
            Long price = item.pricePerPyeong();
            rate.changePrice(price == null || price == 0 ? null : price);
        }
        baseRateRepository.saveAll(rates);
        return getAdminConfig();
    }

    @Transactional
    public EstimateOptionResponse createOption(EstimateOptionRequest req) {
        EstimateOption option = EstimateOption.builder()
                .name(req.name().trim())
                .description(emptyToNull(req.description()))
                .appliesTo(req.appliesTo())
                .pricingType(req.pricingType())
                .unitPrice(req.unitPrice())
                .unitLabel(emptyToNull(req.unitLabel()))
                .active(req.active())
                .displayOrder(req.displayOrder() == null ? nextDisplayOrder() : req.displayOrder())
                .build();
        return EstimateOptionResponse.from(optionRepository.save(option));
    }

    @Transactional
    public EstimateOptionResponse updateOption(Long id, EstimateOptionRequest req) {
        EstimateOption option = optionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("옵션을 찾을 수 없습니다"));
        option.update(req.name().trim(), emptyToNull(req.description()), req.appliesTo(), req.pricingType(),
                req.unitPrice(), emptyToNull(req.unitLabel()), req.active(),
                req.displayOrder() == null ? option.getDisplayOrder() : req.displayOrder());
        return EstimateOptionResponse.from(optionRepository.save(option));
    }

    @Transactional
    public void deleteOption(Long id) {
        EstimateOption option = optionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("옵션을 찾을 수 없습니다"));
        optionRepository.delete(option);
    }

    private int nextDisplayOrder() {
        return optionRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .mapToInt(EstimateOption::getDisplayOrder)
                .max()
                .orElse(-1) + 1;
    }

    /** 읽기 전용 트랜잭션에서도 쓸 수 있도록 없으면 저장하지 않고 기본값만 반환 (저장은 updateSettings에서) */
    private EstimateSettings getOrInitSettings() {
        return settingsRepository.findById(EstimateSettings.SINGLETON_ID)
                .orElseGet(EstimateSettings::defaultSingleton);
    }

    /** 6개 조합(주거/상업 × 3등급)이 항상 존재하도록 보장하고 고정 순서로 반환 */
    private List<EstimateBaseRate> getOrInitRates() {
        List<EstimateBaseRate> existing = baseRateRepository.findAll();
        List<EstimateBaseRate> ordered = new ArrayList<>();
        for (Category category : Category.values()) {
            for (Grade grade : Grade.values()) {
                EstimateBaseRate rate = existing.stream()
                        .filter(r -> r.getCategory() == category && r.getGrade() == grade)
                        .findFirst()
                        .orElseGet(() -> baseRateRepository.save(EstimateBaseRate.empty(category, grade)));
                ordered.add(rate);
            }
        }
        return ordered;
    }

    private static String emptyToNull(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
