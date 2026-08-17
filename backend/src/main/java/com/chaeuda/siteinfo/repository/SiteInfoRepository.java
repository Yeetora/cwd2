package com.chaeuda.siteinfo.repository;

import com.chaeuda.siteinfo.domain.SiteInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteInfoRepository extends JpaRepository<SiteInfo, Long> {
}
