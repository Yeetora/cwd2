package com.chaeuda.file;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalImageStorage implements ImageStorage {

    public static final String PUBLIC_URL_PREFIX = "/files/";

    private final Path baseDir;

    public LocalImageStorage(@Value("${app.upload-dir}") String uploadDir) {
        this.baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.baseDir);
        } catch (IOException e) {
            throw new IllegalStateException("업로드 디렉터리 생성 실패: " + this.baseDir, e);
        }
    }

    @Override
    public StoredFile store(InputStream input, String originalName, String prefix) throws IOException {
        String safePrefix = normalizePrefix(prefix);
        String filename = generateFilename(originalName);

        Path targetDir = safePrefix.isEmpty() ? baseDir : baseDir.resolve(safePrefix);
        ensureWithinBase(targetDir);
        Files.createDirectories(targetDir);

        Path target = targetDir.resolve(filename);
        try (input) {
            Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
        }

        String relativePath = safePrefix.isEmpty() ? filename : safePrefix + "/" + filename;
        return new StoredFile(relativePath, originalName);
    }

    @Override
    public void delete(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            Path target = baseDir.resolve(filePath).normalize();
            ensureWithinBase(target);
            Files.deleteIfExists(target);
        } catch (IllegalArgumentException e) {
            log.warn("Refused to delete file outside upload dir: '{}'", filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file '{}': {}", filePath, e.getMessage());
        }
    }

    @Override
    public String publicUrl(String filePath) {
        return PUBLIC_URL_PREFIX + filePath;
    }

    public Path baseDir() {
        return baseDir;
    }

    private String normalizePrefix(String prefix) {
        if (prefix == null) return "";
        String trimmed = prefix.replace("\\", "/").trim();
        while (trimmed.startsWith("/")) trimmed = trimmed.substring(1);
        while (trimmed.endsWith("/")) trimmed = trimmed.substring(0, trimmed.length() - 1);
        if (trimmed.contains("..")) {
            throw new IllegalArgumentException("invalid prefix: " + prefix);
        }
        return trimmed;
    }

    private String generateFilename(String originalName) {
        String ext = extractExtension(originalName);
        String uuid = UUID.randomUUID().toString();
        return ext.isEmpty() ? uuid : uuid + "." + ext;
    }

    private String extractExtension(String name) {
        if (name == null) return "";
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) return "";
        return name.substring(dot + 1).toLowerCase();
    }

    private void ensureWithinBase(Path target) {
        Path normalized = target.normalize();
        if (!normalized.startsWith(baseDir)) {
            throw new IllegalArgumentException("경로가 업로드 디렉터리를 벗어납니다: " + target);
        }
    }
}
