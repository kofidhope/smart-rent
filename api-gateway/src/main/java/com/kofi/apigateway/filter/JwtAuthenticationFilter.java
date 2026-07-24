package com.kofi.apigateway.filter;

import com.kofi.apigateway.config.GatewayConfig;
import com.kofi.apigateway.util.JwtUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
@Order(1)
public class JwtAuthenticationFilter implements GlobalFilter {

    private final JwtUtil jwtUtil;
    private final GatewayConfig gatewayConfig;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        String path = exchange.getRequest().getURI().getPath();

        log.debug("Gateway filter — path: {}", path);

        // ── Step 1: Check if path is public ───────────────
        // Public paths skip JWT validation entirely
        // e.g. login, register, property search, webhook
        if (gatewayConfig.isPublicPath(path)) {
            log.debug("Public path — " + "skipping JWT: {}", path);
            // Still inject internal secret on public paths
            // so downstream services know the request
            // came through the gateway not directly
            // Exception: Paystack webhook — external caller
            if (!gatewayConfig.isWebhookPath(path)) {
                ServerWebExchange enriched = exchange
                        .mutate()
                        .request(r -> r.header("X-Internal-Secret", gatewayConfig.getInternalSecret()))
                        .build();
                return chain.filter(enriched);
            }

            return chain.filter(exchange);
        }

        // ── Step 2: Extract token ──────────────────────────
        // Try cookie first — this is the secure path
        // when the frontend is running in the browser
        // Fall back to Authorization header for Postman
        // and service-to-service calls during development
        String token = extractTokenFromCookie(exchange);

        if (token == null) {
            log.debug("No cookie found — " + "trying Authorization header");
            token = extractTokenFromHeader(exchange);
        }

        // ── Step 3: Reject if no token found ──────────────
        if (token == null) {
            log.warn("No token found — path: {}", path);
            return unauthorizedResponse(exchange, "Not authenticated");
        }

        // ── Step 4: Validate the token ────────────────────
        if (!jwtUtil.isTokenValid(token)) {
            log.warn("Invalid or expired token — " + "path: {}", path);
            return unauthorizedResponse(exchange, "Invalid or expired token");
        }

        // ── Step 5: Extract claims from token ─────────────
        String email  = jwtUtil.extractEmail(token);
        String userId = jwtUtil.extractUserId(token);
        String role   = jwtUtil.extractRole(token);

        log.debug("JWT valid — userId: {} role: {} " + "path: {}", userId, role, path);

        // ── Step 6: Enrich request and forward ────────────
        // Strip the original Authorization header
        // so downstream services cannot accidentally
        // use the raw JWT — they must use the injected
        // headers instead
        // Remove manually sent X-User-Id or X-User-Role
        // so nobody can spoof their identity
        ServerWebExchange mutatedExchange = exchange
                .mutate()
                .request(builder -> builder
                        // Remove headers clients might
                        // try to inject directly
                        .headers(headers -> {
                            headers.remove(HttpHeaders.AUTHORIZATION);
                            headers.remove("X-User-Id");
                            headers.remove("X-User-Role");
                            headers.remove("X-User-Email");
                        })
                        // Inject verified identity
                        // from the JWT claims
                        .header("X-User-Email", email != null ? email : "")
                        .header("X-User-Id", userId != null ? userId : "")
                        .header("X-User-Role", role != null ? role.toUpperCase() : "")
                        // Internal secret — services
                        // reject requests without this
                        .header("X-Internal-Secret", gatewayConfig.getInternalSecret())
                )
                .build();

        return chain.filter(mutatedExchange);
    }

    // -------------------------------------------------------
    // Extract token from httpOnly cookie
    // This is the primary path when frontend is in browser
    //  sends cookie automatically on every request
    // -------------------------------------------------------
    private String extractTokenFromCookie(ServerWebExchange exchange) {

        HttpCookie cookie = exchange.getRequest()
                .getCookies()
                .getFirst("access_token");

        if (cookie != null && !cookie.getValue().isBlank()) {
            log.debug("Token found in cookie");
            return cookie.getValue();
        }

        return null;
    }

    // -------------------------------------------------------
    // Extract token from Authorization header
    // Fallback for Postman testing and internal calls
    // Format: Authorization: Bearer eyJhbGci...
    // -------------------------------------------------------
    private String extractTokenFromHeader(ServerWebExchange exchange) {

        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            log.debug("Token found in " + "Authorization header");
            return authHeader.substring(7).trim();
        }
        return null;
    }

    // -------------------------------------------------------
    // Returns clean JSON 401 response
    // -------------------------------------------------------
    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String message) {

        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse()
                .getHeaders()
                .setContentType(MediaType.APPLICATION_JSON);

        String body = String.format(
                "{\"status\": 401, " + "\"error\": \"%s\"}", message);

        DataBuffer buffer = exchange.getResponse()
                .bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}