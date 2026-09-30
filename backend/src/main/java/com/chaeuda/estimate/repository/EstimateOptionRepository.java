package com.chaeuda.estimate.repository;

import com.chaeuda.estimate.domain.EstimateOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EstimateOptionRepository extends JpaRepository<EstimateOption, Long> {

    List<EstimateOption> findAllByOrderByDisplayOrderAscIdAsc();

    List<EstimateOption> findAllByActiveTrueOrderByDisplayOrderAscIdAsc();
}
