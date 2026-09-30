package com.chaeuda.estimate.domain;

import com.chaeuda.portfolio.domain.Category;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "estimate_base_rate", uniqueConstraints = {
        @UniqueConstraint(name = "uk_estimate_base_rate_category_grade", columnNames = {"category", "grade"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EstimateBaseRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade;

    /** null이면 해당 등급은 고객에게 제공하지 않음 */
    @Column(name = "price_per_pyeong")
    private Long pricePerPyeong;

    public static EstimateBaseRate empty(Category category, Grade grade) {
        EstimateBaseRate r = new EstimateBaseRate();
        r.category = category;
        r.grade = grade;
        return r;
    }

    public boolean isOffered() {
        return pricePerPyeong != null && pricePerPyeong > 0;
    }

    public void changePrice(Long pricePerPyeong) {
        this.pricePerPyeong = pricePerPyeong;
    }
}
