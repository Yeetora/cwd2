package com.chaeuda.estimate.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "estimate_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EstimateSettings {

    /** 단일 행 — 항상 id=1 */
    public static final Long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(nullable = false)
    private boolean enabled;

    @Enumerated(EnumType.STRING)
    @Column(name = "display_mode", nullable = false)
    private DisplayMode displayMode;

    @Column(name = "range_percent", nullable = false)
    private int rangePercent;

    @Column(name = "minimum_amount")
    private Long minimumAmount;

    @Column(length = 1000)
    private String notice;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static EstimateSettings defaultSingleton() {
        EstimateSettings s = new EstimateSettings();
        s.id = SINGLETON_ID;
        s.enabled = false;
        s.displayMode = DisplayMode.RANGE;
        s.rangePercent = 10;
        s.updatedAt = Instant.now();
        return s;
    }

    public void update(boolean enabled, DisplayMode displayMode, int rangePercent,
                       Long minimumAmount, String notice) {
        this.enabled = enabled;
        this.displayMode = displayMode;
        this.rangePercent = rangePercent;
        this.minimumAmount = minimumAmount;
        this.notice = notice;
        this.updatedAt = Instant.now();
    }
}
