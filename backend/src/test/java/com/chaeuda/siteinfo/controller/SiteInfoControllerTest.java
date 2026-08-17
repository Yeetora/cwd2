package com.chaeuda.siteinfo.controller;

import com.chaeuda.common.auth.AuthProperties;
import com.chaeuda.common.auth.TokenService;
import com.chaeuda.siteinfo.repository.SiteInfoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class SiteInfoControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TokenService tokenService;
    @Autowired private AuthProperties authProperties;
    @Autowired private SiteInfoRepository siteInfoRepository;

    private Cookie sessionCookie;

    @BeforeEach
    void setUp() {
        sessionCookie = new Cookie(authProperties.cookieName(), tokenService.create(1L, "admin"));
    }

    @AfterEach
    void cleanup() {
        siteInfoRepository.deleteAll();
    }

    @Test
    void public_get_returns_initial_empty_response() throws Exception {
        mockMvc.perform(get("/api/site-info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyPhone").doesNotExist())
                .andExpect(jsonPath("$.heroImageUrl").doesNotExist());
    }

    @Test
    void admin_update_persists_contact_fields() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("companyPhone", "02-1234-5678");
        body.put("companyEmail", "ops@chaeuda.com");
        body.put("companyAddress", "서울 강남구 ...");
        body.put("businessHours", "평일 10:00 - 19:00");

        mockMvc.perform(put("/api/admin/site-info")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyPhone").value("02-1234-5678"));

        mockMvc.perform(get("/api/site-info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyPhone").value("02-1234-5678"))
                .andExpect(jsonPath("$.companyEmail").value("ops@chaeuda.com"))
                .andExpect(jsonPath("$.businessHours").value("평일 10:00 - 19:00"));
    }

    @Test
    void admin_update_requires_auth() throws Exception {
        mockMvc.perform(put("/api/admin/site-info")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/admin/site-info/hero-image"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void admin_upload_hero_returns_url() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "hero.jpg", "image/jpeg", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/admin/site-info/hero-image")
                        .file(file)
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.heroImageUrl").isString());

        mockMvc.perform(get("/api/site-info"))
                .andExpect(jsonPath("$.heroImageUrl").isString());
    }

    @Test
    void admin_upload_rejects_invalid_extension() throws Exception {
        MockMultipartFile gif = new MockMultipartFile(
                "file", "evil.gif", "image/gif", new byte[]{1});

        mockMvc.perform(multipart("/api/admin/site-info/hero-image")
                        .file(gif)
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void admin_delete_hero_clears_path() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "hero.jpg", "image/jpeg", new byte[]{1});
        mockMvc.perform(multipart("/api/admin/site-info/hero-image").file(file).cookie(sessionCookie))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/admin/site-info/hero-image").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.heroImageUrl").doesNotExist());
    }

    @Test
    void category_hero_upload_and_delete() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "res.jpg", "image/jpeg", new byte[]{1, 2});

        mockMvc.perform(multipart("/api/admin/site-info/category-hero")
                        .file(file)
                        .param("category", "RESIDENTIAL")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.residentialHeroUrl").isString())
                .andExpect(jsonPath("$.commercialHeroUrl").doesNotExist());

        mockMvc.perform(get("/api/site-info"))
                .andExpect(jsonPath("$.residentialHeroUrl").isString());

        mockMvc.perform(delete("/api/admin/site-info/category-hero")
                        .param("category", "RESIDENTIAL")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.residentialHeroUrl").doesNotExist());
    }

    @Test
    void category_hero_requires_auth() throws Exception {
        mockMvc.perform(post("/api/admin/site-info/category-hero").param("category", "RESIDENTIAL"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/admin/site-info/category-hero").param("category", "RESIDENTIAL"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void category_hero_invalid_category_returns_400() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "res.jpg", "image/jpeg", new byte[]{1});
        mockMvc.perform(multipart("/api/admin/site-info/category-hero")
                        .file(file)
                        .param("category", "OFFICE")
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void admin_delete_hero_when_none_returns_400() throws Exception {
        mockMvc.perform(delete("/api/admin/site-info/hero-image").cookie(sessionCookie))
                .andExpect(status().isBadRequest());
    }
}
