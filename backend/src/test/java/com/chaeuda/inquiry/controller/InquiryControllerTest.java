package com.chaeuda.inquiry.controller;

import com.chaeuda.common.auth.AuthProperties;
import com.chaeuda.common.auth.TokenService;
import com.chaeuda.estimate.domain.EstimateBaseRate;
import com.chaeuda.estimate.domain.EstimateSettings;
import com.chaeuda.estimate.domain.DisplayMode;
import com.chaeuda.estimate.domain.Grade;
import com.chaeuda.estimate.repository.EstimateBaseRateRepository;
import com.chaeuda.estimate.repository.EstimateSettingsRepository;
import com.chaeuda.inquiry.domain.Inquiry;
import com.chaeuda.inquiry.domain.InquiryStatus;
import com.chaeuda.inquiry.repository.InquiryRepository;
import com.chaeuda.portfolio.domain.Category;
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
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class InquiryControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TokenService tokenService;
    @Autowired private AuthProperties authProperties;
    @Autowired private InquiryRepository inquiryRepository;
    @Autowired private EstimateSettingsRepository settingsRepository;
    @Autowired private EstimateBaseRateRepository rateRepository;

    private Cookie sessionCookie;

    @BeforeEach
    void setUp() {
        sessionCookie = new Cookie(authProperties.cookieName(), tokenService.create(1L, "admin"));
    }

    @AfterEach
    void cleanup() {
        inquiryRepository.deleteAll();
        rateRepository.deleteAll();
        settingsRepository.deleteAll();
    }

    @Test
    void create_plain_inquiry_is_saved_as_new() throws Exception {
        mockMvc.perform(post("/api/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body("32평 아파트 상담 원합니다", null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.estimate").doesNotExist());

        List<Inquiry> all = inquiryRepository.findAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getStatus()).isEqualTo(InquiryStatus.NEW);
        assertThat(all.get(0).getEstimateAmount()).isNull();
    }

    @Test
    void create_requires_privacy_agreement_and_required_fields() throws Exception {
        Map<String, Object> noAgree = body("내용", null);
        noAgree.put("privacyAgreed", false);
        mockMvc.perform(post("/api/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(noAgree)))
                .andExpect(status().isBadRequest());

        Map<String, Object> noName = body("내용", null);
        noName.put("name", " ");
        mockMvc.perform(post("/api/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(noName)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body("", null))))
                .andExpect(status().isBadRequest());

        assertThat(inquiryRepository.count()).isZero();
    }

    @Test
    void honeypot_is_accepted_but_not_saved() throws Exception {
        Map<String, Object> bot = body("스팸", null);
        bot.put("website", "http://spam.example");
        mockMvc.perform(post("/api/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(bot)))
                .andExpect(status().isCreated());

        assertThat(inquiryRepository.count()).isZero();
    }

    @Test
    void create_with_estimate_stores_server_calculated_snapshot() throws Exception {
        enableEstimate();

        Map<String, Object> estimate = new HashMap<>();
        estimate.put("category", "RESIDENTIAL");
        estimate.put("grade", "STANDARD");
        estimate.put("areaPyeong", 30);
        estimate.put("options", List.of());

        mockMvc.perform(post("/api/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body("", estimate))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estimate.amount").value(45_000_000))
                .andExpect(jsonPath("$.estimate.minAmount").value(40_500_000))
                .andExpect(jsonPath("$.estimate.maxAmount").value(49_500_000));

        Inquiry saved = inquiryRepository.findAll().get(0);
        assertThat(saved.getEstimateCategory()).isEqualTo(Category.RESIDENTIAL);
        assertThat(saved.getEstimateGrade()).isEqualTo(Grade.STANDARD);
        assertThat(saved.getEstimateAmount()).isEqualTo(45_000_000L);
        assertThat(saved.getEstimateDetail()).contains("주거 · 중급 · 30평").contains("1,500,000원");
    }

    @Test
    void create_with_estimate_fails_when_estimate_disabled() throws Exception {
        Map<String, Object> estimate = new HashMap<>();
        estimate.put("category", "RESIDENTIAL");
        estimate.put("grade", "STANDARD");
        estimate.put("areaPyeong", 30);

        mockMvc.perform(post("/api/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body("상담", estimate))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void admin_endpoints_require_auth() throws Exception {
        mockMvc.perform(get("/api/admin/inquiries")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/inquiries/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/admin/inquiries/1/status")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/admin/inquiries/1")).andExpect(status().isUnauthorized());
    }

    @Test
    void admin_list_detail_status_and_delete() throws Exception {
        enableEstimate();
        Map<String, Object> estimate = new HashMap<>();
        estimate.put("category", "RESIDENTIAL");
        estimate.put("grade", "STANDARD");
        estimate.put("areaPyeong", 30);
        mockMvc.perform(post("/api/inquiries")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(body("견적 문의", estimate)))).andExpect(status().isCreated());
        mockMvc.perform(post("/api/inquiries")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(body("일반 문의", null)))).andExpect(status().isCreated());

        mockMvc.perform(get("/api/admin/inquiries").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(2));

        Long withEstimate = inquiryRepository.findAll().stream()
                .filter(i -> i.getEstimateAmount() != null).findFirst().orElseThrow().getId();

        mockMvc.perform(get("/api/admin/inquiries/" + withEstimate).cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("견적 문의"))
                .andExpect(jsonPath("$.estimate.amount").value(45_000_000))
                .andExpect(jsonPath("$.estimate.detail", containsString("기본 공사")));

        mockMvc.perform(put("/api/admin/inquiries/" + withEstimate + "/status")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CHECKED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED"));

        mockMvc.perform(get("/api/admin/inquiries").param("status", "NEW").cookie(sessionCookie))
                .andExpect(jsonPath("$.items", hasSize(1)));

        mockMvc.perform(delete("/api/admin/inquiries/" + withEstimate).cookie(sessionCookie))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/admin/inquiries/" + withEstimate).cookie(sessionCookie))
                .andExpect(status().isNotFound());
    }

    private void enableEstimate() {
        EstimateSettings settings = EstimateSettings.defaultSingleton();
        settings.update(true, DisplayMode.RANGE, 10, null, "안내");
        settingsRepository.save(settings);
        EstimateBaseRate rate = EstimateBaseRate.empty(Category.RESIDENTIAL, Grade.STANDARD);
        rate.changePrice(1_500_000L);
        rateRepository.save(rate);
    }

    private static Map<String, Object> body(String content, Map<String, Object> estimate) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "홍길동");
        body.put("phone", "010-1234-5678");
        body.put("email", "hong@example.com");
        body.put("content", content);
        body.put("privacyAgreed", true);
        body.put("estimate", estimate);
        return body;
    }

    private String json(Object o) throws Exception {
        return objectMapper.writeValueAsString(o);
    }
}
