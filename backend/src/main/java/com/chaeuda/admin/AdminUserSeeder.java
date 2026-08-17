package com.chaeuda.admin;

import com.chaeuda.admin.domain.AdminUser;
import com.chaeuda.admin.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserSeeder implements ApplicationRunner {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Override
    public void run(ApplicationArguments args) {
        if (adminUserRepository.existsByUsername(adminUsername)) {
            log.info("AdminUser '{}' already exists, skip seeding", adminUsername);
            return;
        }
        AdminUser admin = AdminUser.builder()
                .username(adminUsername)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .email(adminEmail)
                .build();
        adminUserRepository.save(admin);
        log.info("AdminUser '{}' seeded", adminUsername);
    }
}
