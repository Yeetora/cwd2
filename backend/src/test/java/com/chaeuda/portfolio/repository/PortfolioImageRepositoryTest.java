package com.chaeuda.portfolio.repository;

import com.chaeuda.portfolio.domain.PortfolioImage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class PortfolioImageRepositoryTest {

    @Autowired
    private PortfolioImageRepository imageRepository;

    @Test
    void list_by_portfolio_ordered_by_displayOrder_asc() {
        save(10L, "a.jpg", 2, false);
        save(10L, "b.jpg", 0, true);
        save(10L, "c.jpg", 1, false);
        save(99L, "other.jpg", 0, true);

        List<PortfolioImage> images = imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(10L);

        assertThat(images).extracting(PortfolioImage::getFilePath)
                .containsExactly("b.jpg", "c.jpg", "a.jpg");
    }

    @Test
    void findByPortfolioIdAndIsThumbnailTrue() {
        save(10L, "a.jpg", 0, false);
        save(10L, "b.jpg", 1, true);

        Optional<PortfolioImage> thumb = imageRepository.findByPortfolioIdAndIsThumbnailTrue(10L);
        assertThat(thumb).isPresent();
        assertThat(thumb.get().getFilePath()).isEqualTo("b.jpg");
    }

    @Test
    void countByPortfolioId() {
        save(10L, "a.jpg", 0, true);
        save(10L, "b.jpg", 1, false);
        save(99L, "x.jpg", 0, true);

        assertThat(imageRepository.countByPortfolioId(10L)).isEqualTo(2);
        assertThat(imageRepository.countByPortfolioId(99L)).isEqualTo(1);
    }

    @Test
    void deleteAllByPortfolioId_removes_only_target() {
        save(10L, "a.jpg", 0, true);
        save(10L, "b.jpg", 1, false);
        save(99L, "x.jpg", 0, true);

        imageRepository.deleteAllByPortfolioId(10L);
        imageRepository.flush();

        assertThat(imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(10L)).isEmpty();
        assertThat(imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(99L)).hasSize(1);
    }

    private void save(long portfolioId, String filePath, int order, boolean thumbnail) {
        imageRepository.save(PortfolioImage.builder()
                .portfolioId(portfolioId)
                .filePath(filePath)
                .originalName(filePath)
                .displayOrder(order)
                .isThumbnail(thumbnail)
                .build());
    }
}
