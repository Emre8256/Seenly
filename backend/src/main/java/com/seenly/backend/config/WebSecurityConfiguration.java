package com.seenly.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebSecurityConfiguration implements WebMvcConfigurer {
    private final SecurityProperties properties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (properties.getAllowedOrigins().isEmpty()) return;
        registry.addMapping("/api/**")
            .allowedOrigins(properties.getAllowedOrigins().toArray(String[]::new))
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("Content-Type", "X-Owner-Token", "X-Payment-Signature", "X-Request-ID")
            .exposedHeaders("X-Request-ID")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
