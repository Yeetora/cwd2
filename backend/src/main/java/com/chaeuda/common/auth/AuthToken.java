package com.chaeuda.common.auth;

public record AuthToken(Long sub, String username, long iat, long exp) {
}
