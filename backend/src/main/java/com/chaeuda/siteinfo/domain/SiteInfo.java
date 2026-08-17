package com.chaeuda.siteinfo.domain;

import com.chaeuda.portfolio.domain.Category;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "site_info")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SiteInfo {

    /** 단일 행 — 항상 id=1 */
    public static final Long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(name = "company_phone", length = 50)
    private String companyPhone;

    @Column(name = "company_email", length = 255)
    private String companyEmail;

    @Column(name = "company_address", length = 500)
    private String companyAddress;

    @Column(name = "business_hours", length = 200)
    private String businessHours;

    @Column(name = "hero_image_path", length = 500)
    private String heroImagePath;

    @Column(name = "residential_hero_path", length = 500)
    private String residentialHeroPath;

    @Column(name = "commercial_hero_path", length = 500)
    private String commercialHeroPath;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static SiteInfo emptySingleton() {
        SiteInfo s = new SiteInfo();
        s.id = SINGLETON_ID;
        s.updatedAt = Instant.now();
        return s;
    }

    public void updateContact(String companyPhone, String companyEmail, String companyAddress, String businessHours) {
        this.companyPhone = companyPhone;
        this.companyEmail = companyEmail;
        this.companyAddress = companyAddress;
        this.businessHours = businessHours;
        this.updatedAt = Instant.now();
    }

    public void updateHeroImagePath(String path) {
        this.heroImagePath = path;
        this.updatedAt = Instant.now();
    }

    public String getCategoryHeroPath(Category category) {
        return category == Category.RESIDENTIAL ? residentialHeroPath : commercialHeroPath;
    }

    public void updateCategoryHeroPath(Category category, String path) {
        if (category == Category.RESIDENTIAL) {
            this.residentialHeroPath = path;
        } else {
            this.commercialHeroPath = path;
        }
        this.updatedAt = Instant.now();
    }
}
