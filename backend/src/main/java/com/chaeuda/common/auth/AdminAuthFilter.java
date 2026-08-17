package com.chaeuda.common.auth;

import com.chaeuda.common.exception.ApiException;
import com.chaeuda.common.exception.ErrorCode;
import com.chaeuda.common.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@Component
@RequiredArgsConstructor
public class AdminAuthFilter extends OncePerRequestFilter {

    private static final String ADMIN_PREFIX = "/api/admin/";
    private static final String LOGIN_PATH = "/api/admin/auth/login";
    private static final String LOGOUT_PATH = "/api/admin/auth/logout";

    private final AuthProperties authProperties;
    private final TokenService tokenService;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String uri = request.getRequestURI();
        if (!uri.startsWith(ADMIN_PREFIX)) {
            return true;
        }
        if (LOGIN_PATH.equals(uri) || LOGOUT_PATH.equals(uri)) {
            return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String tokenValue = readTokenCookie(request);
        try {
            AuthToken token = tokenService.verify(tokenValue);
            request.setAttribute(AdminAuthentication.REQUEST_ATTRIBUTE,
                    new AdminAuthentication(token.sub(), token.username()));
            chain.doFilter(request, response);
        } catch (ApiException ex) {
            writeUnauthorized(request, response, ex.getMessage());
        } catch (Exception ex) {
            log.warn("Unexpected auth filter error at {}: {}", request.getRequestURI(), ex.getMessage());
            writeUnauthorized(request, response, "인증 실패");
        }
    }

    private String readTokenCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (authProperties.cookieName().equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }

    private void writeUnauthorized(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException {
        ErrorResponse body = ErrorResponse.of(ErrorCode.UNAUTHORIZED, message, request.getRequestURI());
        response.setStatus(ErrorCode.UNAUTHORIZED.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
