package com.chaeuda.file;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class FileServingTest {

    private static Path tempUploadDir;

    @BeforeAll
    static void createTempUploadDir() throws IOException {
        tempUploadDir = Files.createTempDirectory("chaeuda-file-serving-test-");
    }

    @AfterAll
    static void cleanup() throws IOException {
        if (tempUploadDir != null && Files.exists(tempUploadDir)) {
            try (var paths = Files.walk(tempUploadDir)) {
                paths.sorted((a, b) -> b.getNameCount() - a.getNameCount())
                        .forEach(p -> p.toFile().delete());
            }
        }
    }

    @DynamicPropertySource
    static void registerProps(DynamicPropertyRegistry registry) {
        registry.add("app.upload-dir", () -> tempUploadDir.toString());
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LocalImageStorage storage;

    @Test
    void existing_file_is_served() throws Exception {
        byte[] content = "hello-world".getBytes();
        StoredFile stored = storage.store(new java.io.ByteArrayInputStream(content), "test.png", "portfolios/1");

        mockMvc.perform(get("/files/" + stored.filePath()))
                .andExpect(status().isOk())
                .andExpect(content().bytes(content));
    }

    @Test
    void missing_file_returns_404() throws Exception {
        mockMvc.perform(get("/files/portfolios/999/nope.jpg"))
                .andExpect(status().isNotFound());
    }

    private InputStream stream(byte[] bytes) {
        return new java.io.ByteArrayInputStream(bytes);
    }
}
