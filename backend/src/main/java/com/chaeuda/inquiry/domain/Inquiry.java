package com.chaeuda.inquiry.domain;

import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.portfolio.domain.Category;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "inquiry", indexes = {
        @Index(name = "ix_inquiry_status_created_at", columnList = "status, created_at"),
        @Index(name = "ix_inquiry_created_at", columnList = "created_at")
})
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(length = 255)
    private String email;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InquiryStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // ── 예상 견적 스냅샷 (견적과 함께 들어온 문의만) ──
    @Enumerated(EnumType.STRING)
    @Column(name = "estimate_category")
    private Category estimateCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "estimate_grade")
    private Grade estimateGrade;

    @Column(name = "estimate_area", precision = 7, scale = 1)
    private BigDecimal estimateArea;

    @Column(name = "estimate_amount")
    private Long estimateAmount;

    @Column(name = "estimate_min")
    private Long estimateMin;

    @Column(name = "estimate_max")
    private Long estimateMax;

    @Column(name = "estimate_detail", columnDefinition = "TEXT")
    private String estimateDetail;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = InquiryStatus.NEW;
    }

    public void changeStatus(InquiryStatus status) {
        this.status = status;
    }
}
