package com.chaeuda.portfolio.controller;

import com.chaeuda.common.auth.AuthProperties;
import com.chaeuda.common.auth.TokenService;
import com.chaeuda.portfolio.domain.Category;
import com.chaeuda.portfolio.domain.Portfolio;
import com.chaeuda.portfolio.domain.PortfolioImage;
import com.chaeuda.portfolio.repository.PortfolioImageRepository;
import com.chaeuda.portfolio.repository.PortfolioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AdminPortfolioImageControllerTest {

    @TempDir
    static Path tempUploadDir;

    @DynamicPropertySource
    static void registerProps(DynamicPropertyRegistry registry) {
        registry.add("app.upload-dir", () -> tempUploadDir.toString());
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PortfolioRepository portfolioRepository;
    @Autowired private PortfolioImageRepository imageRepository;
    @Autowired private TokenService tokenService;
    @Autowired private AuthProperties authProperties;

    private Cookie sessionCookie;
    private Portfolio portfolio;

    @BeforeEach
    void setUp() {
        sessionCookie = new Cookie(authProperties.cookieName(), tokenService.create(1L, "admin"));
        portfolio = portfolioRepository.save(Portfolio.builder()
                .title("샘플")
                .category(Category.RESIDENTIAL)
                .isPublished(true)
                .build());
    }

    @AfterEach
    void cleanup() {
        imageRepository.deleteAll();
        portfolioRepository.deleteAll();
    }

    private MockMultipartFile mockFile(String name) {
        return new MockMultipartFile("files", name, "image/jpeg", new byte[]{1, 2, 3, 4});
    }

    @Test
    void upload_requires_auth() throws Exception {
        mockMvc.perform(multipart("/api/admin/portfolios/" + portfolio.getId() + "/images")
                        .file(mockFile("a.jpg")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void upload_first_image_becomes_thumbnail_automatically() throws Exception {
        mockMvc.perform(multipart("/api/admin/portfolios/" + portfolio.getId() + "/images")
                        .file(mockFile("a.jpg"))
                        .cookie(sessionCookie))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].isThumbnail").value(true))
                .andExpect(jsonPath("$[0].url").value(org.hamcrest.Matchers.startsWith("/files/portfolios/" + portfolio.getId() + "/")));
    }

    @Test
    void upload_multiple_files_first_only_is_thumbnail() throws Exception {
        mockMvc.perform(multipart("/api/admin/portfolios/" + portfolio.getId() + "/images")
                        .file(mockFile("a.jpg"))
                        .file(mockFile("b.png"))
                        .file(mockFile("c.webp"))
                        .cookie(sessionCookie))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].isThumbnail").value(true))
                .andExpect(jsonPath("$[1].isThumbnail").value(false))
                .andExpect(jsonPath("$[2].isThumbnail").value(false))
                .andExpect(jsonPath("$[0].displayOrder").value(0))
                .andExpect(jsonPath("$[1].displayOrder").value(1))
                .andExpect(jsonPath("$[2].displayOrder").value(2));
    }

    @Test
    void subsequent_uploads_do_not_steal_thumbnail() throws Exception {
        mockMvc.perform(multipart("/api/admin/portfolios/" + portfolio.getId() + "/images")
                .file(mockFile("a.jpg")).cookie(sessionCookie));

        mockMvc.perform(multipart("/api/admin/portfolios/" + portfolio.getId() + "/images")
                        .file(mockFile("b.jpg"))
                        .cookie(sessionCookie))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].isThumbnail").value(false))
                .andExpect(jsonPath("$[0].displayOrder").value(1));

        long thumbCount = imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(portfolio.getId())
                .stream().filter(PortfolioImage::isThumbnail).count();
        assertThat(thumbCount).isEqualTo(1);
    }

    @Test
    void upload_rejects_when_exceeding_10_images() throws Exception {
        // pre-fill 9 directly via repo
        for (int i = 0; i < 9; i++) {
            imageRepository.save(PortfolioImage.builder()
                    .portfolioId(portfolio.getId())
                    .filePath("seed" + i + ".jpg")
                    .displayOrder(i)
                    .isThumbnail(i == 0)
                    .build());
        }

        mockMvc.perform(multipart("/api/admin/portfolios/" + portfolio.getId() + "/images")
                        .file(mockFile("a.jpg"))
                        .file(mockFile("b.jpg"))
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("최대 10")));
    }

    @Test
    void upload_rejects_invalid_extension() throws Exception {
        MockMultipartFile gif = new MockMultipartFile("files", "evil.gif", "image/gif", new byte[]{1});

        mockMvc.perform(multipart("/api/admin/portfolios/" + portfolio.getId() + "/images")
                        .file(gif)
                        .cookie(sessionCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void upload_to_missing_portfolio_returns_404() throws Exception {
        mockMvc.perform(multipart("/api/admin/portfolios/99999/images")
                        .file(mockFile("a.jpg"))
                        .cookie(sessionCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void reorder_updates_display_orders() throws Exception {
        var ids = uploadThree();

        Map<String, Object> body = Map.of(
                "orders", List.of(
                        Map.of("imageId", ids.get(2), "order", 0),
                        Map.of("imageId", ids.get(0), "order", 1),
                        Map.of("imageId", ids.get(1), "order", 2)
                )
        );

        mockMvc.perform(put("/api/admin/portfolios/" + portfolio.getId() + "/images/order")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(ids.get(2)))
                .andExpect(jsonPath("$[1].id").value(ids.get(0)))
                .andExpect(jsonPath("$[2].id").value(ids.get(1)));
    }

    @Test
    void reorder_rejects_partial_list() throws Exception {
        var ids = uploadThree();

        Map<String, Object> body = Map.of(
                "orders", List.of(Map.of("imageId", ids.get(0), "order", 0))
        );

        mockMvc.perform(put("/api/admin/portfolios/" + portfolio.getId() + "/images/order")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reorder_rejects_foreign_image_id() throws Exception {
        var ids = uploadThree();

        Map<String, Object> body = Map.of(
                "orders", List.of(
                        Map.of("imageId", ids.get(0), "order", 0),
                        Map.of("imageId", ids.get(1), "order", 1),
                        Map.of("imageId", 99999L, "order", 2)
                )
        );

        mockMvc.perform(put("/api/admin/portfolios/" + portfolio.getId() + "/images/order")
                        .cookie(sessionCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void set_thumbnail_changes_designation() throws Exception {
        var ids = uploadThree();

        mockMvc.perform(put("/api/admin/portfolios/" + portfolio.getId() + "/images/" + ids.get(2) + "/thumbnail")
                        .cookie(sessionCookie))
                .andExpect(status().isOk());

        List<PortfolioImage> all = imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(portfolio.getId());
        assertThat(all).filteredOn(PortfolioImage::isThumbnail)
                .extracting(PortfolioImage::getId)
                .containsExactly(ids.get(2));
    }

    @Test
    void set_thumbnail_with_foreign_image_returns_404() throws Exception {
        uploadThree();

        mockMvc.perform(put("/api/admin/portfolios/" + portfolio.getId() + "/images/99999/thumbnail")
                        .cookie(sessionCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_image_removes_row_and_file() throws Exception {
        var ids = uploadThree();
        PortfolioImage second = imageRepository.findById(ids.get(1)).orElseThrow();
        Path file = tempUploadDir.resolve(second.getFilePath());
        assertThat(Files.exists(file)).isTrue();

        mockMvc.perform(delete("/api/admin/portfolios/" + portfolio.getId() + "/images/" + ids.get(1))
                        .cookie(sessionCookie))
                .andExpect(status().isNoContent());

        assertThat(imageRepository.findById(ids.get(1))).isEmpty();
        assertThat(Files.exists(file)).isFalse();
    }

    @Test
    void delete_thumbnail_promotes_next_lowest_order() throws Exception {
        var ids = uploadThree();
        // Initially ids.get(0) is thumbnail
        assertThat(imageRepository.findById(ids.get(0)).orElseThrow().isThumbnail()).isTrue();

        mockMvc.perform(delete("/api/admin/portfolios/" + portfolio.getId() + "/images/" + ids.get(0))
                        .cookie(sessionCookie))
                .andExpect(status().isNoContent());

        PortfolioImage newThumb = imageRepository.findByPortfolioIdAndIsThumbnailTrue(portfolio.getId()).orElseThrow();
        assertThat(newThumb.getId()).isEqualTo(ids.get(1));
    }

    @Test
    void delete_missing_image_returns_404() throws Exception {
        mockMvc.perform(delete("/api/admin/portfolios/" + portfolio.getId() + "/images/99999")
                        .cookie(sessionCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void portfolio_delete_cleans_up_images_and_files() throws Exception {
        var ids = uploadThree();
        List<Path> files = imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(portfolio.getId())
                .stream().map(PortfolioImage::getFilePath).map(tempUploadDir::resolve).toList();
        for (Path f : files) assertThat(Files.exists(f)).isTrue();

        mockMvc.perform(delete("/api/admin/portfolios/" + portfolio.getId())
                        .cookie(sessionCookie))
                .andExpect(status().isNoContent());

        for (Long imageId : ids) {
            assertThat(imageRepository.findById(imageId)).isEmpty();
        }
        for (Path f : files) {
            assertThat(Files.exists(f)).isFalse();
        }
    }

    private List<Long> uploadThree() throws Exception {
        String response = mockMvc.perform(multipart("/api/admin/portfolios/" + portfolio.getId() + "/images")
                        .file(mockFile("a.jpg"))
                        .file(mockFile("b.jpg"))
                        .file(mockFile("c.jpg"))
                        .cookie(sessionCookie))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> list = objectMapper.readValue(response, List.class);
        return list.stream().map(m -> ((Number) m.get("id")).longValue()).toList();
    }
}
