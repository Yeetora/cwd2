package com.chaeuda.admin.auth;

import com.chaeuda.admin.domain.AdminUser;
import com.chaeuda.common.auth.AdminAuthentication;
import com.chaeuda.common.auth.AuthProperties;
import com.chaeuda.common.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AdminAuthService authService;
    private final AuthProperties authProperties;

    @PostMapping("/login")
    public ResponseEntity<AdminInfoResponse> login(@Valid @RequestBody LoginRequest request) {
        var result = authService.login(request.username(), request.password());
        ResponseCookie cookie = buildCookie(result.token(), authProperties.cookieMaxAgeSeconds());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(AdminInfoResponse.from(result.admin()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie cookie = buildCookie("", 0);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @GetMapping("/me")
    public AdminInfoResponse me(HttpServletRequest request) {
        AdminAuthentication auth = (AdminAuthentication) request.getAttribute(AdminAuthentication.REQUEST_ATTRIBUTE);
        if (auth == null) {
            throw ApiException.unauthorized("인증 정보가 없습니다");
        }
        AdminUser admin = authService.getById(auth.id());
        return AdminInfoResponse.from(admin);
    }

    private ResponseCookie buildCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from(authProperties.cookieName(), value)
                .httpOnly(true)
                .secure(authProperties.cookieSecure())
                .sameSite(authProperties.cookieSameSite())
                .path(authProperties.cookiePath())
                .maxAge(maxAgeSeconds)
                .build();
    }
}
