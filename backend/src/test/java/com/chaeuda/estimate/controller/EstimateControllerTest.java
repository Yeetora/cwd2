package com.chaeuda.estimate.controller;

import com.chaeuda.common.auth.AuthProperties;
import com.chaeuda.common.auth.TokenService;
import com.chaeuda.estimate.repository.EstimateBaseRateRepository;
import com.chaeuda.estimate.repository.EstimateOptionRepository;
import com.chaeuda.estimate.repository.EstimateSettingsRepository;
import com.fasterxml.jackson.databind.JsonNode;
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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class EstimateControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TokenService tokenService;
    @Autowired private AuthProperties authProperties;
    @Autowired private EstimateSettingsRepository settingsRepository;
    @Autowired private EstimateBaseRateRepository rateRepository;
    @Autowired private EstimateOptionRepository optionRepository;

    private Cookie sessionCookie;

    @BeforeEach
    void setUp() {
        sessionCookie = new Cookie(authProperties.cookieName(), tokenService.create(1L, "admin"));
    }

    @AfterEach
    void cleanup() {
        optionRepository.deleteAll();
        rateRepository.deleteAll();
        settingsRepository.deleteAll();
    }

    @Test
    void admin_endpoints_require_auth() throws Exception {
        mockMvc.perform(get("/api/admin/estimate")).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/admin/estimate/settings")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/admin/estimate/rates")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/estimate/options")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/admin/estimate/options/1")).andExpect(status().isUnauthorized());
    }

    @Test
    void admin_get_initializes_six_rates() throws Exception {
        mockMvc.perform(get("/api/admin/estimate").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settings.enabled").value(false))
                .andExpect(jsonPath("$.settings.displayMode").value("RANGE"))
                .andExpect(jsonPath("$.rates", hasSize(6)))
                .andExpect(jsonPath("$.options", hasSize(0)));
    }

    @Test
    void public_config_is_disabled_by_default_and_calculate_rejected() throws Exception {
        mockMvc.perform(get("/api/estimate/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false))
                .andExpect(jsonPath("$.categories", hasSize(0)));

        mockMvc.perform(post("/api/estimate/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(estimate("RESIDENTIAL", "STANDARD", 32, List.of()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void enabled_without_any_rate_is_hidden_from_public() throws Exception {
        enable("RANGE", 10, null);

        mockMvc.perform(get("/api/estimate/config"))
                .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    void public_config_lists_offered_grades_with_rate_and_hides_option_prices() throws Exception {
        enable("RANGE", 10, null);
        setRate("RESIDENTIAL", "STANDARD", 1_500_000L);
        long fanId = createOption("실링팬", "ALL", "PER_UNIT", 350_000L, "대", true);
        createOption("숨김 옵션", "ALL", "FIXED", 1_000L, null, false);

        mockMvc.perform(get("/api/estimate/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.categories", hasSize(1)))
                .andExpect(jsonPath("$.categories[0].category").value("RESIDENTIAL"))
                .andExpect(jsonPath("$.categories[0].grades", hasSize(1)))
                .andExpect(jsonPath("$.categories[0].grades[0].grade").value("STANDARD"))
                .andExpect(jsonPath("$.categories[0].grades[0].label").value("중급"))
                .andExpect(jsonPath("$.options", hasSize(1)))
                .andExpect(jsonPath("$.options[0].id").value(fanId))
                .andExpect(jsonPath("$.options[0].unitPrice").doesNotExist())
                .andExpect(jsonPath("$.categories[0].grades[0].pricePerPyeong").value(1_500_000));
    }

    @Test
    void calculate_returns_rounded_range() throws Exception {
        enable("RANGE", 10, null);
        setRate("RESIDENTIAL", "STANDARD", 1_500_000L);
        long fanId = createOption("실링팬", "ALL", "PER_UNIT", 350_000L, "대", true);

        // 32 × 1,500,000 + 2 × 350,000 = 48,700,000
        mockMvc.perform(post("/api/estimate/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(estimate("RESIDENTIAL", "STANDARD", 32,
                                List.of(Map.of("optionId", fanId, "quantity", 2))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayMode").value("RANGE"))
                .andExpect(jsonPath("$.amount").value(48_700_000))
                .andExpect(jsonPath("$.minAmount").value(43_830_000))
                .andExpect(jsonPath("$.maxAmount").value(53_570_000));
    }

    @Test
    void calculate_rejects_unoffered_grade_and_mismatched_option() throws Exception {
        enable("SINGLE", 0, null);
        setRate("RESIDENTIAL", "STANDARD", 1_500_000L);
        long commercialOnly = createOption("간판", "COMMERCIAL", "FIXED", 3_000_000L, null, true);

        mockMvc.perform(post("/api/estimate/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(estimate("RESIDENTIAL", "PREMIUM", 32, List.of()))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/estimate/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(estimate("RESIDENTIAL", "STANDARD", 32,
                                List.of(Map.of("optionId", commercialOnly))))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void calculate_requires_quantity_for_per_unit_option() throws Exception {
        enable("RANGE", 10, null);
        setRate("RESIDENTIAL", "BASIC", 1_000_000L);
        long fanId = createOption("실링팬", "ALL", "PER_UNIT", 350_000L, "대", true);

        mockMvc.perform(post("/api/estimate/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(estimate("RESIDENTIAL", "BASIC", 20,
                                List.of(Map.of("optionId", fanId))))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void calculate_validates_area() throws Exception {
        enable("RANGE", 10, null);
        setRate("RESIDENTIAL", "BASIC", 1_000_000L);

        mockMvc.perform(post("/api/estimate/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(estimate("RESIDENTIAL", "BASIC", 0, List.of()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void admin_option_update_and_delete() throws Exception {
        long id = createOption("실링팬", "ALL", "PER_UNIT", 350_000L, "대", true);

        Map<String, Object> body = optionBody("실링팬(고급)", "RESIDENTIAL", "PER_UNIT", 500_000L, "대", false);
        mockMvc.perform(put("/api/admin/estimate/options/" + id)
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("실링팬(고급)"))
                .andExpect(jsonPath("$.unitPrice").value(500_000))
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(delete("/api/admin/estimate/options/" + id).cookie(sessionCookie))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/admin/estimate/options/" + id).cookie(sessionCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void admin_option_validation() throws Exception {
        Map<String, Object> body = optionBody("", "ALL", "FIXED", -1L, null, true);
        mockMvc.perform(post("/api/admin/estimate/options")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void admin_rate_zero_clears_price() throws Exception {
        setRate("COMMERCIAL", "PREMIUM", 2_000_000L);
        setRate("COMMERCIAL", "PREMIUM", 0L);

        mockMvc.perform(get("/api/admin/estimate").cookie(sessionCookie))
                .andExpect(jsonPath("$.rates[5].category").value("COMMERCIAL"))
                .andExpect(jsonPath("$.rates[5].grade").value("PREMIUM"))
                .andExpect(jsonPath("$.rates[5].pricePerPyeong").doesNotExist());
    }

    // ── helpers ──

    private void enable(String displayMode, int rangePercent, Long minimumAmount) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("enabled", true);
        body.put("displayMode", displayMode);
        body.put("rangePercent", rangePercent);
        body.put("minimumAmount", minimumAmount);
        body.put("notice", "실측 후 달라질 수 있습니다");
        mockMvc.perform(put("/api/admin/estimate/settings")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settings.enabled").value(true));
    }

    private void setRate(String category, String grade, Long price) throws Exception {
        Map<String, Object> rate = new HashMap<>();
        rate.put("category", category);
        rate.put("grade", grade);
        rate.put("pricePerPyeong", price);
        mockMvc.perform(put("/api/admin/estimate/rates")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("rates", List.of(rate)))))
                .andExpect(status().isOk());
    }

    private long createOption(String name, String appliesTo, String pricingType, long price,
                              String unitLabel, boolean active) throws Exception {
        String res = mockMvc.perform(post("/api/admin/estimate/options")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(optionBody(name, appliesTo, pricingType, price, unitLabel, active))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(res);
        return node.get("id").asLong();
    }

    private static Map<String, Object> optionBody(String name, String appliesTo, String pricingType, long price,
                                                  String unitLabel, boolean active) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("appliesTo", appliesTo);
        body.put("pricingType", pricingType);
        body.put("unitPrice", price);
        body.put("unitLabel", unitLabel);
        body.put("active", active);
        return body;
    }

    private static Map<String, Object> estimate(String category, String grade, double area, List<?> options) {
        Map<String, Object> body = new HashMap<>();
        body.put("category", category);
        body.put("grade", grade);
        body.put("areaPyeong", area);
        body.put("options", options);
        return body;
    }

    private String json(Object o) throws Exception {
        return objectMapper.writeValueAsString(o);
    }
}
