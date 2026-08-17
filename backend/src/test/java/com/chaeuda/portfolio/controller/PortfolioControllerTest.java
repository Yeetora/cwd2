package com.chaeuda.portfolio.controller;

import com.chaeuda.portfolio.domain.Category;
import com.chaeuda.portfolio.domain.Portfolio;
import com.chaeuda.portfolio.repository.PortfolioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class PortfolioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PortfolioRepository portfolioRepository;

    @AfterEach
    void cleanup() {
        portfolioRepository.deleteAll();
    }

    @Test
    void public_list_filters_by_category_and_excludes_unpublished() throws Exception {
        save("A", Category.RESIDENTIAL, true);
        save("B", Category.RESIDENTIAL, false);
        save("C", Category.COMMERCIAL, true);

        mockMvc.perform(get("/api/portfolios").param("category", "RESIDENTIAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].title").value("A"));

        mockMvc.perform(get("/api/portfolios").param("category", "COMMERCIAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].title").value("C"));
    }

    @Test
    void public_list_requires_category_param() throws Exception {
        mockMvc.perform(get("/api/portfolios"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void public_list_invalid_category_returns_400() throws Exception {
        mockMvc.perform(get("/api/portfolios").param("category", "OFFICE"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void public_detail_returns_portfolio_when_published() throws Exception {
        Portfolio p = save("Hello", Category.RESIDENTIAL, true);

        mockMvc.perform(get("/api/portfolios/" + p.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Hello"))
                .andExpect(jsonPath("$.category").value("RESIDENTIAL"))
                .andExpect(jsonPath("$.images").isArray());
    }

    @Test
    void public_detail_unpublished_returns_404() throws Exception {
        Portfolio p = save("Hidden", Category.RESIDENTIAL, false);

        mockMvc.perform(get("/api/portfolios/" + p.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void public_detail_missing_returns_404() throws Exception {
        mockMvc.perform(get("/api/portfolios/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void adjacent_returns_neighbors_within_same_category_and_published_only() throws Exception {
        Portfolio first = save("first", Category.RESIDENTIAL, true);
        Portfolio middle = save("middle", Category.RESIDENTIAL, true);
        Portfolio last = save("last", Category.RESIDENTIAL, true);
        save("commercial", Category.COMMERCIAL, true);
        save("hidden", Category.RESIDENTIAL, false);

        mockMvc.perform(get("/api/portfolios/" + middle.getId() + "/adjacent")
                        .param("category", "RESIDENTIAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previous.id").value(first.getId()))
                .andExpect(jsonPath("$.next.id").value(last.getId()));

        mockMvc.perform(get("/api/portfolios/" + first.getId() + "/adjacent")
                        .param("category", "RESIDENTIAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previous").doesNotExist())
                .andExpect(jsonPath("$.next.id").value(middle.getId()));

        mockMvc.perform(get("/api/portfolios/" + last.getId() + "/adjacent")
                        .param("category", "RESIDENTIAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previous.id").value(middle.getId()))
                .andExpect(jsonPath("$.next").doesNotExist());
    }

    @Test
    void list_supports_pagination() throws Exception {
        for (int i = 0; i < 15; i++) {
            save("item " + i, Category.RESIDENTIAL, true);
        }

        mockMvc.perform(get("/api/portfolios")
                        .param("category", "RESIDENTIAL")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(15))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items.length()").value(10));

        mockMvc.perform(get("/api/portfolios")
                        .param("category", "RESIDENTIAL")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(jsonPath("$.items.length()").value(5));
    }

    private Portfolio save(String title, Category category, boolean published) {
        return portfolioRepository.save(Portfolio.builder()
                .title(title)
                .category(category)
                .isPublished(published)
                .build());
    }
}
