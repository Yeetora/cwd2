package com.chaeuda.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class FileWebConfig implements WebMvcConfigurer {

    private final String uploadDir;

    public FileWebConfig(@Value("${app.upload-dir}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        String location = base.toUri().toString();
        registry.addResourceHandler(LocalImageStorage.PUBLIC_URL_PREFIX + "**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }
}
