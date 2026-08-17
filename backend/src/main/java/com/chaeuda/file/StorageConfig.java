package com.chaeuda.file;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageConfig {

    @Bean
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
    public S3Client s3Client(StorageProperties properties) {
        StorageProperties.S3 s3 = properties.s3();
        if (s3 == null || s3.bucket() == null || s3.region() == null) {
            throw new IllegalStateException(
                    "app.storage.type=s3 인데 app.storage.s3.bucket / region이 비어있습니다");
        }

        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(s3.region()))
                .httpClient(UrlConnectionHttpClient.builder().build())
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(s3.endpointOverride() != null)
                        .build());

        if (s3.endpointOverride() != null && !s3.endpointOverride().isBlank()) {
            builder.endpointOverride(URI.create(s3.endpointOverride()));
        }
        return builder.build();
    }
}
