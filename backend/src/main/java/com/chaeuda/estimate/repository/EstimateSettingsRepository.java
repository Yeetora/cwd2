package com.chaeuda.estimate.repository;

import com.chaeuda.estimate.domain.EstimateSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstimateSettingsRepository extends JpaRepository<EstimateSettings, Long> {
}
