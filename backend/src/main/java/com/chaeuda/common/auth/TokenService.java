package com.chaeuda.common.auth;

import com.chaeuda.common.exception.ApiException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;

@Service
public class TokenService {

    private static final String ALGO = "HmacSHA256";
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    private final AuthProperties properties;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public TokenService(AuthProperties properties, ObjectMapper objectMapper, Clock clock) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public String create(Long adminId, String username) {
        long now = clock.instant().getEpochSecond();
        long exp = now + properties.cookieMaxAgeSeconds();
        AuthToken token = new AuthToken(adminId, username, now, exp);
        String payload = encodePayload(token);
        String signature = sign(payload);
        return payload + "." + signature;
    }

    public AuthToken verify(String raw) {
        if (raw == null || raw.isBlank()) {
            throw ApiException.unauthorized("토큰이 없습니다");
        }
        int dot = raw.indexOf('.');
        if (dot <= 0 || dot == raw.length() - 1) {
            throw ApiException.unauthorized("토큰 형식이 올바르지 않습니다");
        }
        String payload = raw.substring(0, dot);
        String providedSig = raw.substring(dot + 1);
        String expectedSig = sign(payload);

        if (!constantTimeEquals(providedSig, expectedSig)) {
            throw ApiException.unauthorized("토큰 서명이 일치하지 않습니다");
        }

        AuthToken decoded = decodePayload(payload);
        long now = clock.instant().getEpochSecond();
        if (decoded.exp() < now) {
            throw ApiException.unauthorized("토큰이 만료되었습니다");
        }
        return decoded;
    }

    private String encodePayload(AuthToken token) {
        try {
            byte[] json = objectMapper.writeValueAsBytes(token);
            return ENCODER.encodeToString(json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("토큰 직렬화 실패", e);
        }
    }

    private AuthToken decodePayload(String payload) {
        try {
            byte[] json = DECODER.decode(payload);
            return objectMapper.readValue(json, AuthToken.class);
        } catch (IllegalArgumentException | java.io.IOException e) {
            throw ApiException.unauthorized("토큰 페이로드가 올바르지 않습니다");
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(ALGO);
            mac.init(new SecretKeySpec(properties.secret().getBytes(StandardCharsets.UTF_8), ALGO));
            byte[] sig = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return ENCODER.encodeToString(sig);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HMAC 생성 실패", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    /** 테스트 용도. */
    public Instant nowInstant() {
        return clock.instant();
    }
}
