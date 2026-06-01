package com.kofi.apigateway.filter;

import com.kofi.apigateway.config.GatewayConfig;
import com.kofi.apigateway.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class JwtAuthenticationFilter implements GlobalFilter {

    private final JwtUtil jwtUtil;
    private final GatewayConfig gatewayConfig;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        String path = exchange.getRequest().getURI().getPath();

        log.debug("Gateway filter — path: {}", path);

        // ── Public paths — skip JWT validation ───────────────
        // Read from config not hardcoded like your /auth check
        // Covers /api/auth/**, /api/properties/search,
        // /api/payments/webhook, /actuator/health
        if (gatewayConfig.isPublicPath(path)) {
            log.debug("Public path — skipping JWT: {}", path);

            // Still inject internal secret for public paths
            // so services know request came through gateway
            // EXCEPT webhook — Paystack is external
            if (!gatewayConfig.isWebhookPath(path)) {
                ServerWebExchange enriched = exchange.mutate()
                        .request(r -> r.header("X-Internal-Secret", gatewayConfig.getInternalSecret()))
                        .build();
                return chain.filter(enriched);
            }

            return chain.filter(exchange);
        }

        // ── Get Authorization header ──────────────────────────
        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        // ── No token ──────────────────────────────────────────
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Missing or invalid Authorization " + "header — path: {}", path);
            return unauthorizedResponse(exchange, "Authorization header missing");
        }

        String token = authHeader.substring(7).trim();

        // ── Invalid token ─────────────────────────────────────
        if (!jwtUtil.isTokenValid(token)) {
            log.warn("Invalid JWT token — path: {}", path);
            return unauthorizedResponse(exchange, "Invalid or expired token");
        }

        // ── Token valid — extract claims ──────────────────────
        String email  = jwtUtil.extractEmail(token);
        String userId   = jwtUtil.extractUserId(token);
        String role   = jwtUtil.extractRole(token);

        log.debug("JWT valid — userId: {} role: {} path: {}", userId, role, path);

        // ── Mutate request — inject headers ───────────────────
        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(builder -> builder
                        // Your original headers — keep them
                        .header("X-User-Email", email)
                        .header("X-User-Id", String.valueOf(userId))
                        .header("X-User-Role", role.toUpperCase())
                        // New — services verify this to confirm
                        // request came through the gateway
                        .header("X-Internal-Secret", gatewayConfig.getInternalSecret())
                )
                .build();

        return chain.filter(mutatedExchange);
    }

    // -------------------------------------------------------
    // Returns a proper JSON 401 response
    // Your original returned empty body — this gives
    // the client a readable error message
    // -------------------------------------------------------
    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String message) {
        exchange.getResponse()
                .setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse()
                .getHeaders()
                .setContentType(MediaType.APPLICATION_JSON);

        String body = String.format("{\"status\": 401, \"error\": \"%s\"}", message);

        DataBuffer buffer = exchange.getResponse()
                .bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
