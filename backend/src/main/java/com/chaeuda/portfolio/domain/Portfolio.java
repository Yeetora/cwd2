package com.chaeuda.portfolio.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "portfolio", indexes = {
        @Index(name = "ix_portfolio_category_created_at", columnList = "category, created_at"),
        @Index(name = "ix_portfolio_is_published", columnList = "is_published")
})
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Portfolio {

    public static final int MAX_IMAGES = 10;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Column(length = 200)
    private String location;

    @Column(name = "area_size", length = 50)
    private String areaSize;

    @Column(length = 50)
    private String duration;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_published", nullable = false)
    private boolean isPublished;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void update(String title, Category category, String location,
                       String areaSize, String duration, String description,
                       boolean isPublished) {
        this.title = title;
        this.category = category;
        this.location = location;
        this.areaSize = areaSize;
        this.duration = duration;
        this.description = description;
        this.isPublished = isPublished;
    }
}
