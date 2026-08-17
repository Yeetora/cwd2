package com.chaeuda.portfolio.repository;

import com.chaeuda.portfolio.domain.Category;
import com.chaeuda.portfolio.domain.Portfolio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    Page<Portfolio> findAllByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(Category category, Pageable pageable);

    Page<Portfolio> findAllByCategoryOrderByCreatedAtDesc(Category category, Pageable pageable);

    Page<Portfolio> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<Portfolio> findByIdAndIsPublishedTrue(Long id);

    Optional<Portfolio> findFirstByCategoryAndIsPublishedTrueAndIdLessThanOrderByIdDesc(Category category, Long id);

    Optional<Portfolio> findFirstByCategoryAndIsPublishedTrueAndIdGreaterThanOrderByIdAsc(Category category, Long id);
}
