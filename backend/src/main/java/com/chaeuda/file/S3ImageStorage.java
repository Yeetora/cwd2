package com.chaeuda.file;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3ImageStorage implements ImageStorage {

    private static final Map<String, String> EXT_TO_MIME = Map.of(
            "jpg",  "image/jpeg",
            "jpeg", "image/jpeg",
            "png",  "image/png",
            "webp", "image/webp"
    );

    private final S3Client s3Client;
    private final StorageProperties properties;

    public S3ImageStorage(S3Client s3Client, StorageProperties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
        validate();
    }

    private void validate() {
        StorageProperties.S3 s3 = properties.s3();
        if (s3 == null || s3.bucket() == null || s3.bucket().isBlank()) {
            throw new IllegalStateException("app.storage.s3.bucket is required when storage type is s3");
        }
    }

    @Override
    public StoredFile store(InputStream input, String originalName, String prefix) throws IOException {
        String key = buildKey(normalizePrefix(prefix), generateFilename(originalName));
        byte[] bytes = input.readAllBytes();

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(properties.s3().bucket())
                            .key(key)
                            .contentType(contentTypeFor(originalName))
                            .contentLength((long) bytes.length)
                            .build(),
                    RequestBody.fromBytes(bytes)
            );
        } catch (SdkException e) {
            throw new IOException("S3 putObject failed: " + key, e);
        }
        return new StoredFile(key, originalName);
    }

    @Override
    public void delete(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(properties.s3().bucket())
                    .key(filePath)
                    .build());
        } catch (NoSuchKeyException e) {
            // 파일이 이미 없으면 무시 (멱등성)
        } catch (SdkException e) {
            log.warn("S3 delete failed for {}: {}", filePath, e.getMessage());
        }
    }

    @Override
    public String publicUrl(String filePath) {
        String base = properties.s3().publicUrlBase();
        if (base == null || base.isBlank()) {
            StorageProperties.S3 s3 = properties.s3();
            return String.format("https://%s.s3.%s.amazonaws.com/%s", s3.bucket(), s3.region(), filePath);
        }
        String trimmed = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        return trimmed + "/" + filePath;
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

    private String buildKey(String prefix, String filename) {
        return prefix.isEmpty() ? filename : prefix + "/" + filename;
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

    private String contentTypeFor(String name) {
        return EXT_TO_MIME.getOrDefault(extractExtension(name), "application/octet-stream");
    }
}
