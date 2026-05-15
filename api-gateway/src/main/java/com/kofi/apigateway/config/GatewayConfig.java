package com.kofi.apigateway.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Getter
@Configuration
@Slf4j
public class GatewayConfig {

    // Internal secret shared between gateway and all services
    // Gateway injects this as X-Internal-Secret header
    // Services reject requests missing this header
    // Prevents direct access bypassing the gateway
    @Value("${gateway.internal-secret}")
    private String internalSecret;

    // -------------------------------------------------------
    // Rate limiting — requests per minute per user
    // Stored and tracked in Redis
    // Applied per userId extracted from JWT
    // Unauthenticated requests tracked by IP address
    // -------------------------------------------------------
    @Value("${gateway.rate-limit.requests-per-minute}")
    private int requestsPerMinute;

    @Value("${gateway.rate-limit.burst-capacity}")
    private int burstCapacity;

    // Public paths — skip JWT validation for these
    // Read by JwtAuthenticationFilter to decide
    // whether to validate the token or pass through
    @Value("${gateway.public-paths}")
    private List<String> publicPaths;

    // CORS allowed origins
    // Frontend URLs that can call the gateway
    @Value("${gateway.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${gateway.cors.allowed-methods}")
    private List<String> allowedMethods;

    @Value("${gateway.cors.allowed-headers}")
    private List<String> allowedHeaders;

    @Value("${gateway.cors.allow-credentials}")
    private boolean allowCredentials;

    @Value("${gateway.cors.max-age}")
    private long maxAge;

    // -------------------------------------------------------
    // Getters — no Lombok @Data here because
    // we are using @Value injection
    // -------------------------------------------------------

    // -------------------------------------------------------
    // Checks if a given path is public
    // Called by JwtAuthenticationFilter on every request
    // Uses startsWith so /api/auth/login matches /api/auth
    // -------------------------------------------------------
    public boolean isPublicPath(String path) {
        return publicPaths.stream()
                .anyMatch(path::startsWith);
    }

    // -------------------------------------------------------
    // Checks if a path is the Paystack webhook specifically
    // Webhook needs special handling — no JWT but also
    // no internal secret check since Paystack is external
    // -------------------------------------------------------
    public boolean isWebhookPath(String path) {
        return path.startsWith("/api/payments/webhook");
    }
}
