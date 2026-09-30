package com.chaeuda.estimate.repository;

import com.chaeuda.estimate.domain.EstimateBaseRate;
import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.portfolio.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstimateBaseRateRepository extends JpaRepository<EstimateBaseRate, Long> {

    Optional<EstimateBaseRate> findByCategoryAndGrade(Category category, Grade grade);
}
