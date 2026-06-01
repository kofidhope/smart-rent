package com.kofi.apigateway.config;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "gateway")
@Slf4j
public class GatewayConfig {

    // -------------------------------------------------------
    // Internal secret shared between gateway and services
    // -------------------------------------------------------
    private String internalSecret;



    // -------------------------------------------------------
    // Public paths
    // -------------------------------------------------------
    private List<String> publicPaths;

    // -------------------------------------------------------
    // Rate limit config
    // Maps:
    // gateway.rate-limit.*
    // -------------------------------------------------------
    private RateLimit rateLimit;

    // -------------------------------------------------------
    // CORS config
    // Maps:
    // gateway.cors.*
    // -------------------------------------------------------
    private Cors cors;

    // -------------------------------------------------------
    // Nested class for rate limiting
    // -------------------------------------------------------
    @Getter
    @Setter
    public static class RateLimit {

        private int requestsPerMinute;

        private int burstCapacity;
    }

    // -------------------------------------------------------
    // Nested class for CORS
    // -------------------------------------------------------
    @Getter
    @Setter
    public static class Cors {

        private List<String> allowedOrigins;

        private List<String> allowedMethods;

        private List<String> allowedHeaders;

        private List<String> exposedHeaders;

        private boolean allowCredentials;

        private long maxAge;
    }

    // -------------------------------------------------------
    // Utility Methods
    // -------------------------------------------------------

    public boolean isPublicPath(String path) {

        return publicPaths.stream()
                .anyMatch(path::startsWith);
    }

    public boolean isWebhookPath(String path) {

        return path.startsWith("/api/payments/webhook");
    }
}