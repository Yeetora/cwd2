package com.chaeuda.estimate.domain;

public enum Grade {
    BASIC("기본"),
    STANDARD("중급"),
    PREMIUM("고급");

    private final String label;

    Grade(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
