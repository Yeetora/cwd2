package com.chaeuda.file;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(
        String type,                 // "local" | "s3"
        S3 s3
) {
    public StorageProperties {
        if (type == null || type.isBlank()) {
            type = "local";
        }
    }

    public record S3(
            String bucket,
            String region,
            String publicUrlBase,    // 예: https://cdn.example.com 또는 https://bucket.s3.region.amazonaws.com
            String endpointOverride  // LocalStack 등 테스트용 (null이면 기본 AWS endpoint)
    ) {
    }
}
