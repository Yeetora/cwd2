package com.chaeuda.estimate.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "estimate_option", indexes = {
        @Index(name = "ix_estimate_option_display_order", columnList = "display_order")
})
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class EstimateOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 300)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "applies_to", nullable = false)
    private AppliesTo appliesTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_type", nullable = false)
    private PricingType pricingType;

    @Column(name = "unit_price", nullable = false)
    private long unitPrice;

    @Column(name = "unit_label", length = 20)
    private String unitLabel;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

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

    public void update(String name, String description, AppliesTo appliesTo, PricingType pricingType,
                       long unitPrice, String unitLabel, boolean active, int displayOrder) {
        this.name = name;
        this.description = description;
        this.appliesTo = appliesTo;
        this.pricingType = pricingType;
        this.unitPrice = unitPrice;
        this.unitLabel = unitLabel;
        this.active = active;
        this.displayOrder = displayOrder;
        this.updatedAt = Instant.now();
    }
}
