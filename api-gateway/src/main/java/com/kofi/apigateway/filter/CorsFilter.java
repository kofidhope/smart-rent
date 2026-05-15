package com.kofi.apigateway.filter;

import com.kofi.apigateway.config.GatewayConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(0)
public class CorsFilter implements GlobalFilter {

    private final GatewayConfig gatewayConfig;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        String origin = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.ORIGIN);

        // No origin header — not a browser request
        // Could be Postman, curl, or server-to-server
        // Skip CORS handling entirely
        if (origin == null) {
            return chain.filter(exchange);
        }

        // ── Check if origin is allowed ────────────────────────
        boolean originAllowed = gatewayConfig
                .getAllowedOrigins()
                .contains(origin);

        if (!originAllowed) {
            log.warn("CORS rejected — origin not allowed: {}", origin);
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }

        // ── Handle preflight OPTIONS request ──────────────────
        // Browser sends OPTIONS before the real request
        // to check if CORS is allowed.
        // Must respond immediately with 200 — do NOT
        // forward preflight to downstream services
        if (exchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
            log.debug("CORS preflight — origin: {}", origin);
            addCorsHeaders(exchange, origin);
            exchange.getResponse().setStatusCode(HttpStatus.OK);
            return exchange.getResponse().setComplete();
        }

        // ── Regular request — add CORS headers to response ───
        // Headers are added before forwarding so they appear
        // on the response the browser receives
        addCorsHeaders(exchange, origin);

        return chain.filter(exchange);
    }

    // Add all required CORS headers to the response
    // Called for both preflight and regular requests
    private void addCorsHeaders(ServerWebExchange exchange, String origin) {
        HttpHeaders headers = exchange.getResponse().getHeaders();
        // Echo back the specific allowed origin
        // Never use wildcard * with credentials
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
        // Which HTTP methods the browser can use
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, String.join(", ", gatewayConfig.getAllowedMethods()));
        // Which request headers the browser can send
        headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, String.join(", ", gatewayConfig.getAllowedHeaders()));
        // Which response headers the browser can read
        // X-Rate-Limit-Remaining needs to be here
        // or the frontend cannot read it
        headers.add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "X-Rate-Limit-Limit, X-Rate-Limit-Remaining");
        // Allow cookies and Authorization header
        // Required for JWT in Authorization header
        if (gatewayConfig.isAllowCredentials()) {
            headers.add(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
        }
        // How long browser caches preflight response
        // 3600 = 1 hour — browser skips preflight
        // for subsequent requests within this time
        headers.add(HttpHeaders.ACCESS_CONTROL_MAX_AGE, String.valueOf(gatewayConfig.getMaxAge()));
    }
}
