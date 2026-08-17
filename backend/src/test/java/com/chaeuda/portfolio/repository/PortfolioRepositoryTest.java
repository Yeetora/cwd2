package com.chaeuda.portfolio.repository;

import com.chaeuda.portfolio.domain.Category;
import com.chaeuda.portfolio.domain.Portfolio;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class PortfolioRepositoryTest {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Test
    void list_published_residential_in_created_desc() throws InterruptedException {
        save("A 주거", Category.RESIDENTIAL, true);
        Thread.sleep(5);
        save("B 주거", Category.RESIDENTIAL, true);
        save("비공개 주거", Category.RESIDENTIAL, false);
        save("상업", Category.COMMERCIAL, true);

        Page<Portfolio> page = portfolioRepository
                .findAllByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(Category.RESIDENTIAL, PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Portfolio::getTitle)
                .containsExactly("B 주거", "A 주거");
    }

    @Test
    void admin_list_includes_unpublished() {
        save("공개", Category.RESIDENTIAL, true);
        save("비공개", Category.RESIDENTIAL, false);

        Page<Portfolio> page = portfolioRepository
                .findAllByCategoryOrderByCreatedAtDesc(Category.RESIDENTIAL, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
    }

    @Test
    void findByIdAndIsPublishedTrue_returns_only_published() {
        Portfolio published = save("공개", Category.RESIDENTIAL, true);
        Portfolio hidden = save("비공개", Category.RESIDENTIAL, false);

        assertThat(portfolioRepository.findByIdAndIsPublishedTrue(published.getId())).isPresent();
        assertThat(portfolioRepository.findByIdAndIsPublishedTrue(hidden.getId())).isEmpty();
    }

    @Test
    void update_changes_fields_and_bumps_updatedAt() throws InterruptedException {
        Portfolio p = save("원본", Category.RESIDENTIAL, true);
        var originalUpdatedAt = p.getUpdatedAt();
        Thread.sleep(10);

        p.update("수정됨", Category.COMMERCIAL, "서울", "30평", "2주", "설명", false);
        portfolioRepository.saveAndFlush(p);

        Portfolio reloaded = portfolioRepository.findById(p.getId()).orElseThrow();
        assertThat(reloaded.getTitle()).isEqualTo("수정됨");
        assertThat(reloaded.getCategory()).isEqualTo(Category.COMMERCIAL);
        assertThat(reloaded.isPublished()).isFalse();
        assertThat(reloaded.getUpdatedAt()).isAfter(originalUpdatedAt);
    }

    private Portfolio save(String title, Category category, boolean published) {
        return portfolioRepository.save(Portfolio.builder()
                .title(title)
                .category(category)
                .isPublished(published)
                .build());
    }
}
