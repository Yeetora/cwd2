package com.chaeuda.common.auth;

public record AdminAuthentication(Long id, String username) {
    public static final String REQUEST_ATTRIBUTE = "chaeuda.auth.admin";
}
