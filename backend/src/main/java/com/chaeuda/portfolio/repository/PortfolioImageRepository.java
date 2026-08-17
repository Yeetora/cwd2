package com.chaeuda.portfolio.repository;

import com.chaeuda.portfolio.domain.PortfolioImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PortfolioImageRepository extends JpaRepository<PortfolioImage, Long> {

    List<PortfolioImage> findAllByPortfolioIdOrderByDisplayOrderAsc(Long portfolioId);

    Optional<PortfolioImage> findByPortfolioIdAndIsThumbnailTrue(Long portfolioId);

    List<PortfolioImage> findAllByPortfolioIdInAndIsThumbnailTrue(Collection<Long> portfolioIds);

    long countByPortfolioId(Long portfolioId);

    @Modifying
    @Query("delete from PortfolioImage pi where pi.portfolioId = :portfolioId")
    void deleteAllByPortfolioId(@Param("portfolioId") Long portfolioId);
}
