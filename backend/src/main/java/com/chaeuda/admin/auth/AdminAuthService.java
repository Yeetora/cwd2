package com.chaeuda.admin.auth;

import com.chaeuda.admin.domain.AdminUser;
import com.chaeuda.admin.repository.AdminUserRepository;
import com.chaeuda.common.auth.TokenService;
import com.chaeuda.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Transactional(readOnly = true)
    public LoginResult login(String username, String rawPassword) {
        AdminUser user = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("로그인 정보가 올바르지 않습니다"));
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw ApiException.unauthorized("로그인 정보가 올바르지 않습니다");
        }
        String token = tokenService.create(user.getId(), user.getUsername());
        return new LoginResult(user, token);
    }

    @Transactional(readOnly = true)
    public AdminUser getById(Long id) {
        return adminUserRepository.findById(id)
                .orElseThrow(() -> ApiException.unauthorized("관리자 계정을 찾을 수 없습니다"));
    }

    public record LoginResult(AdminUser admin, String token) {}
}
