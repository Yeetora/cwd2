package com.chaeuda.common.auth;

import com.chaeuda.common.exception.ApiException;
import com.chaeuda.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TokenServiceTest {

    private final AuthProperties props = new AuthProperties(
            "test-secret-32-bytes-minimum-please-ok",
            "chaeuda_admin_session",
            3600L,
            false,
            "Lax",
            "/"
    );
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void create_then_verify_roundtrip() {
        TokenService svc = new TokenService(props, mapper, Clock.systemUTC());
        String raw = svc.create(1L, "admin");

        AuthToken decoded = svc.verify(raw);

        assertThat(decoded.sub()).isEqualTo(1L);
        assertThat(decoded.username()).isEqualTo("admin");
        assertThat(decoded.exp()).isGreaterThan(decoded.iat());
        assertThat(decoded.exp() - decoded.iat()).isEqualTo(3600L);
    }

    @Test
    void verify_rejects_tampered_payload() {
        TokenService svc = new TokenService(props, mapper, Clock.systemUTC());
        String raw = svc.create(1L, "admin");

        int dot = raw.indexOf('.');
        String tampered = raw.substring(0, dot - 1) + "X" + raw.substring(dot);

        assertThatThrownBy(() -> svc.verify(tampered))
                .isInstanceOf(ApiException.class)
                .matches(e -> ((ApiException) e).getErrorCode() == ErrorCode.UNAUTHORIZED);
    }

    @Test
    void verify_rejects_tampered_signature() {
        TokenService svc = new TokenService(props, mapper, Clock.systemUTC());
        String raw = svc.create(1L, "admin");

        String tampered = raw.substring(0, raw.length() - 1) + (raw.endsWith("A") ? "B" : "A");

        assertThatThrownBy(() -> svc.verify(tampered))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void verify_rejects_when_signed_with_different_secret() {
        TokenService a = new TokenService(props, mapper, Clock.systemUTC());
        AuthProperties otherProps = new AuthProperties(
                "different-secret-32-bytes-different-ok",
                "chaeuda_admin_session", 3600L, false, "Lax", "/");
        TokenService b = new TokenService(otherProps, mapper, Clock.systemUTC());

        String tokenFromA = a.create(1L, "admin");

        assertThatThrownBy(() -> b.verify(tokenFromA))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void verify_rejects_expired_token() {
        Instant pinned = Instant.parse("2026-01-01T00:00:00Z");
        Clock past = Clock.fixed(pinned, ZoneOffset.UTC);
        TokenService issuer = new TokenService(props, mapper, past);
        String raw = issuer.create(1L, "admin");

        Clock future = Clock.fixed(pinned.plusSeconds(props.cookieMaxAgeSeconds() + 1), ZoneOffset.UTC);
        TokenService verifier = new TokenService(props, mapper, future);

        assertThatThrownBy(() -> verifier.verify(raw))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void verify_rejects_null_and_blank() {
        TokenService svc = new TokenService(props, mapper, Clock.systemUTC());

        assertThatThrownBy(() -> svc.verify(null)).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> svc.verify("")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> svc.verify("no-dot-here")).isInstanceOf(ApiException.class);
    }
}
