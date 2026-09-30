package com.chaeuda.estimate.repository;

import com.chaeuda.estimate.domain.EstimateBaseRate;
import com.chaeuda.estimate.domain.EstimateSettings;
import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.portfolio.domain.Category;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class EstimateBaseRateRepositoryTest {

    @Autowired
    private EstimateBaseRateRepository rateRepository;

    @Autowired
    private EstimateSettingsRepository settingsRepository;

    @Test
    void find_by_category_and_grade() {
        EstimateBaseRate rate = EstimateBaseRate.empty(Category.RESIDENTIAL, Grade.STANDARD);
        rate.changePrice(1_500_000L);
        rateRepository.save(rate);
        rateRepository.save(EstimateBaseRate.empty(Category.COMMERCIAL, Grade.STANDARD));

        assertThat(rateRepository.findByCategoryAndGrade(Category.RESIDENTIAL, Grade.STANDARD))
                .get().extracting(EstimateBaseRate::getPricePerPyeong).isEqualTo(1_500_000L);
        assertThat(rateRepository.findByCategoryAndGrade(Category.COMMERCIAL, Grade.STANDARD))
                .get().extracting(EstimateBaseRate::isOffered).isEqualTo(false);
        assertThat(rateRepository.findByCategoryAndGrade(Category.COMMERCIAL, Grade.PREMIUM)).isEmpty();
    }

    @Test
    void category_grade_is_unique() {
        rateRepository.saveAndFlush(EstimateBaseRate.empty(Category.RESIDENTIAL, Grade.BASIC));

        assertThatThrownBy(() -> rateRepository.saveAndFlush(EstimateBaseRate.empty(Category.RESIDENTIAL, Grade.BASIC)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void settings_singleton_round_trip() {
        settingsRepository.save(EstimateSettings.defaultSingleton());

        EstimateSettings loaded = settingsRepository.findById(EstimateSettings.SINGLETON_ID).orElseThrow();
        assertThat(loaded.isEnabled()).isFalse();
        assertThat(loaded.getRangePercent()).isEqualTo(10);
    }
}
