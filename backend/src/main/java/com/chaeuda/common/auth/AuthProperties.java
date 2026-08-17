package com.chaeuda.common.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(
        String secret,
        String cookieName,
        long cookieMaxAgeSeconds,
        boolean cookieSecure,
        String cookieSameSite,
        String cookiePath
) {
    public AuthProperties {
        if (secret == null || secret.length() < 16) {
            throw new IllegalStateException("app.auth.secret must be at least 16 chars");
        }
        if (cookieName == null || cookieName.isBlank()) {
            cookieName = "chaeuda_admin_session";
        }
        if (cookieMaxAgeSeconds <= 0) {
            cookieMaxAgeSeconds = 86400L;
        }
        if (cookieSameSite == null || cookieSameSite.isBlank()) {
            cookieSameSite = "Lax";
        }
        if (cookiePath == null || cookiePath.isBlank()) {
            cookiePath = "/";
        }
    }
}
