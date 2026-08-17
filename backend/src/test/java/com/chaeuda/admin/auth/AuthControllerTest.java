package com.chaeuda.admin.auth;

import com.chaeuda.common.auth.AuthProperties;
import com.chaeuda.common.auth.TokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthProperties authProperties;

    @Autowired
    private TokenService tokenService;

    @Test
    void login_with_correct_credentials_returns_200_and_sets_cookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(Map.of("username", "admin", "password", "admin"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.email").value("admin@example.com"))
                .andExpect(header().exists("Set-Cookie"))
                .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains(authProperties.cookieName() + "=");
        assertThat(setCookie).contains("HttpOnly");
        assertThat(setCookie).contains("SameSite=Lax");
    }

    @Test
    void login_with_wrong_password_returns_401() throws Exception {
        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(Map.of("username", "admin", "password", "wrong"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void login_with_unknown_user_returns_401() throws Exception {
        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(Map.of("username", "ghost", "password", "admin"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_with_blank_fields_returns_400() throws Exception {
        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(Map.of("username", "", "password", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }

    @Test
    void me_without_cookie_returns_401() throws Exception {
        mockMvc.perform(get("/api/admin/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void me_with_invalid_cookie_returns_401() throws Exception {
        mockMvc.perform(get("/api/admin/auth/me")
                        .cookie(new Cookie(authProperties.cookieName(), "garbage.value")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_with_valid_cookie_returns_admin_info() throws Exception {
        String token = tokenService.create(1L, "admin");

        mockMvc.perform(get("/api/admin/auth/me")
                        .cookie(new Cookie(authProperties.cookieName(), token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.email").value("admin@example.com"));
    }

    @Test
    void logout_clears_cookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/admin/auth/logout"))
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains(authProperties.cookieName() + "=");
        assertThat(setCookie).contains("Max-Age=0");
    }

    @Test
    void cors_preflight_for_admin_endpoint_is_allowed_without_cookie() throws Exception {
        mockMvc.perform(options("/api/admin/portfolios")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk());

        mockMvc.perform(options("/api/admin/auth/me")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk());
    }

    @Test
    void end_to_end_login_then_me() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(Map.of("username", "admin", "password", "admin"))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie sessionCookie = login.getResponse().getCookie(authProperties.cookieName());
        assertThat(sessionCookie).isNotNull();

        mockMvc.perform(get("/api/admin/auth/me").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"));
    }
}
