package com.chaeuda.estimate.repository;

import com.chaeuda.estimate.domain.AppliesTo;
import com.chaeuda.estimate.domain.EstimateOption;
import com.chaeuda.estimate.domain.PricingType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class EstimateOptionRepositoryTest {

    @Autowired
    private EstimateOptionRepository repository;

    @Test
    void prePersist_sets_timestamps() {
        EstimateOption saved = repository.save(option("실링팬", true, 0));

        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void list_is_ordered_by_display_order_then_id() {
        repository.save(option("C", true, 2));
        repository.save(option("A", true, 0));
        repository.save(option("B", false, 1));

        assertThat(repository.findAllByOrderByDisplayOrderAscIdAsc())
                .extracting(EstimateOption::getName).containsExactly("A", "B", "C");
    }

    @Test
    void active_list_excludes_inactive() {
        repository.save(option("A", true, 0));
        repository.save(option("B", false, 1));

        assertThat(repository.findAllByActiveTrueOrderByDisplayOrderAscIdAsc())
                .extracting(EstimateOption::getName).containsExactly("A");
    }

    private static EstimateOption option(String name, boolean active, int order) {
        return EstimateOption.builder()
                .name(name)
                .appliesTo(AppliesTo.ALL)
                .pricingType(PricingType.PER_UNIT)
                .unitPrice(100_000L)
                .unitLabel("개")
                .active(active)
                .displayOrder(order)
                .build();
    }
}
