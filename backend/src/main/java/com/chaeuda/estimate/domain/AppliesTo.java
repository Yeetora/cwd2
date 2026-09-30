package com.chaeuda.estimate.domain;

import com.chaeuda.portfolio.domain.Category;

public enum AppliesTo {
    ALL,
    RESIDENTIAL,
    COMMERCIAL;

    public boolean matches(Category category) {
        return this == ALL || name().equals(category.name());
    }
}
