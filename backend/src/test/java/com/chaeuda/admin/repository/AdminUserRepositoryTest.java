package com.chaeuda.admin.repository;

import com.chaeuda.admin.domain.AdminUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class AdminUserRepositoryTest {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Test
    void save_and_findByUsername() {
        AdminUser admin = AdminUser.builder()
                .username("admin")
                .passwordHash("hash")
                .email("admin@example.com")
                .build();
        adminUserRepository.save(admin);

        Optional<AdminUser> found = adminUserRepository.findByUsername("admin");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("admin@example.com");
        assertThat(found.get().getCreatedAt()).isNotNull();
    }

    @Test
    void existsByUsername_true_when_present() {
        adminUserRepository.save(AdminUser.builder()
                .username("admin")
                .passwordHash("hash")
                .email("admin@example.com")
                .build());

        assertThat(adminUserRepository.existsByUsername("admin")).isTrue();
        assertThat(adminUserRepository.existsByUsername("ghost")).isFalse();
    }
}
