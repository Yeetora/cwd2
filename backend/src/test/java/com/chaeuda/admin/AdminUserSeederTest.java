package com.chaeuda.admin;

import com.chaeuda.admin.domain.AdminUser;
import com.chaeuda.admin.repository.AdminUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AdminUserSeederTest {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void admin_user_is_seeded_on_application_startup() {
        AdminUser admin = adminUserRepository.findByUsername("admin")
                .orElseThrow(() -> new AssertionError("admin not seeded"));

        assertThat(admin.getEmail()).isEqualTo("admin@example.com");
        assertThat(passwordEncoder.matches("admin", admin.getPasswordHash())).isTrue();
        assertThat(admin.getCreatedAt()).isNotNull();
    }
}
