package com.chaeuda.portfolio.controller;

import com.chaeuda.common.auth.AuthProperties;
import com.chaeuda.common.auth.TokenService;
import com.chaeuda.portfolio.domain.Category;
import com.chaeuda.portfolio.domain.Portfolio;
import com.chaeuda.portfolio.repository.PortfolioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AdminPortfolioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private AuthProperties authProperties;

    private Cookie sessionCookie;

    @BeforeEach
    void issueCookie() {
        String token = tokenService.create(1L, "admin");
        sessionCookie = new Cookie(authProperties.cookieName(), token);
    }

    @AfterEach
    void cleanup() {
        portfolioRepository.deleteAll();
    }

    @Test
    void requires_auth_for_all_endpoints() throws Exception {
        mockMvc.perform(get("/api/admin/portfolios")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/portfolios/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/portfolios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/admin/portfolios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/admin/portfolios/1")).andExpect(status().isUnauthorized());
    }

    @Test
    void admin_list_includes_unpublished_and_filters_by_category() throws Exception {
        save("A", Category.RESIDENTIAL, true);
        save("B", Category.RESIDENTIAL, false);
        save("C", Category.COMMERCIAL, true);

        mockMvc.perform(get("/api/admin/portfolios").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));

        mockMvc.perform(get("/api/admin/portfolios")
                        .cookie(sessionCookie)
                        .param("category", "RESIDENTIAL"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void admin_detail_returns_unpublished_too() throws Exception {
        Portfolio p = save("hidden", Category.RESIDENTIAL, false);

        mockMvc.perform(get("/api/admin/portfolios/" + p.getId()).cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("hidden"))
                .andExpect(jsonPath("$.isPublished").value(false));
    }

    @Test
    void create_returns_201_and_persists() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("title", "신혼집");
        body.put("category", "RESIDENTIAL");
        body.put("location", "서울 강남구");
        body.put("areaSize", "32평");
        body.put("duration", "3주");
        body.put("description", "따뜻한 우드톤");

        mockMvc.perform(post("/api/admin/portfolios")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("신혼집"))
                .andExpect(jsonPath("$.category").value("RESIDENTIAL"))
                .andExpect(jsonPath("$.isPublished").value(true));

        assertThat(portfolioRepository.count()).isEqualTo(1);
    }

    @Test
    void create_validates_required_fields() throws Exception {
        Map<String, Object> invalid = Map.of("title", "");

        mockMvc.perform(post("/api/admin/portfolios")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }

    @Test
    void create_with_invalid_category_returns_400() throws Exception {
        Map<String, Object> invalid = Map.of("title", "ok", "category", "INVALID");

        mockMvc.perform(post("/api/admin/portfolios")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_changes_fields() throws Exception {
        Portfolio existing = save("원본", Category.RESIDENTIAL, true);

        Map<String, Object> body = new HashMap<>();
        body.put("title", "수정됨");
        body.put("category", "COMMERCIAL");
        body.put("location", "부산");
        body.put("areaSize", "50평");
        body.put("duration", "4주");
        body.put("description", "리모델링");
        body.put("isPublished", false);

        mockMvc.perform(put("/api/admin/portfolios/" + existing.getId())
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정됨"))
                .andExpect(jsonPath("$.category").value("COMMERCIAL"))
                .andExpect(jsonPath("$.isPublished").value(false));

        Portfolio reloaded = portfolioRepository.findById(existing.getId()).orElseThrow();
        assertThat(reloaded.getCategory()).isEqualTo(Category.COMMERCIAL);
        assertThat(reloaded.isPublished()).isFalse();
    }

    @Test
    void update_missing_returns_404() throws Exception {
        Map<String, Object> body = Map.of(
                "title", "x",
                "category", "RESIDENTIAL",
                "isPublished", true
        );

        mockMvc.perform(put("/api/admin/portfolios/99999")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_returns_204_and_removes() throws Exception {
        Portfolio p = save("to delete", Category.RESIDENTIAL, true);

        mockMvc.perform(delete("/api/admin/portfolios/" + p.getId()).cookie(sessionCookie))
                .andExpect(status().isNoContent());

        assertThat(portfolioRepository.findById(p.getId())).isEmpty();
    }

    @Test
    void delete_missing_returns_404() throws Exception {
        mockMvc.perform(delete("/api/admin/portfolios/99999").cookie(sessionCookie))
                .andExpect(status().isNotFound());
    }

    private Portfolio save(String title, Category category, boolean published) {
        return portfolioRepository.save(Portfolio.builder()
                .title(title)
                .category(category)
                .isPublished(published)
                .build());
    }
}
