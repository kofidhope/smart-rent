package com.kofi.apigateway.filter;

import com.kofi.apigateway.config.GatewayConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class RateLimitFilter implements GlobalFilter {

    private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;
    private final GatewayConfig gatewayConfig;

    // Redis key prefix for rate limit counters
    private static final String RATE_LIMIT_PREFIX = "rate_limit:";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        // ── Build Redis key
        // Authenticated users tracked by userId
        // Unauthenticated requests tracked by IP address
        // This prevents one user from exhausting limits
        // for everyone else on the same network
        String rateLimitKey = buildRateLimitKey(exchange);

        return reactiveRedisTemplate.opsForValue()
                // Increment counter atomically
                // Returns current count after increment
                .increment(RATE_LIMIT_PREFIX + rateLimitKey)
                .flatMap(count -> {
                    // First request — set expiry to 60 seconds
                    // Counter resets automatically after 1 minute
                    if (count == 1) {
                        return reactiveRedisTemplate
                                .expire(RATE_LIMIT_PREFIX + rateLimitKey, Duration.ofSeconds(60))
                                .then(processRequest(exchange, chain, count, rateLimitKey));
                    }

                    return processRequest(exchange, chain, count, rateLimitKey);
                })
                .onErrorResume(e -> {
                    // Redis is down — fail open
                    // Allow the request through rather than
                    // blocking all traffic because Redis
                    // is temporarily unavailable
                    log.error("Redis rate limit error — " + "failing open: {}", e.getMessage());
                    return chain.filter(exchange);
                });
    }

    // Process request based on current count
    // Adds rate limit headers to every response
    // Rejects with 429 when limit is exceeded
    private Mono<Void> processRequest(ServerWebExchange exchange, GatewayFilterChain chain, Long count, String rateLimitKey) {

        int limit = gatewayConfig.getRateLimit().getRequestsPerMinute();
        long remaining = Math.max(0, limit - count);

        // Add rate limit info headers to response
        // Client can read these to know their usage
        exchange.getResponse().getHeaders()
                .add("X-Rate-Limit-Limit", String.valueOf(limit));
        exchange.getResponse().getHeaders()
                .add("X-Rate-Limit-Remaining", String.valueOf(remaining));

        // Limit exceeded — reject with 429
        if (count > limit) {
            log.warn("Rate limit exceeded — key: {} " + "count: {} limit: {}", rateLimitKey, count, limit);

            return rateLimitResponse(exchange, remaining);
        }

        log.debug("Rate limit — key: {} count: {}/{} " + "remaining: {}", rateLimitKey, count, limit, remaining);

        return chain.filter(exchange);
    }

    // Build the Redis key for this request
    // Authenticated: rate_limit:user:1
    // Unauthenticated: rate_limit:ip:192.168.1.1
    private String buildRateLimitKey(ServerWebExchange exchange) {

        // Check if JWT filter already extracted userId
        String userId = exchange.getRequest()
                .getHeaders()
                .getFirst("X-User-Id");

        if (userId != null && !userId.isBlank()) {
            return "user:" + userId;
        }

        // Fall back to IP address for unauthenticated
        String ip = getClientIp(exchange);
        return "ip:" + ip;
    }

    // Extract real client IP
    // Checks X-Forwarded-For first — set by load balancers
    // and proxies in front of the gateway
    // Falls back to direct remote address
    private String getClientIp(ServerWebExchange exchange) {
        String forwardedFor = exchange.getRequest()
                .getHeaders()
                .getFirst("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            // X-Forwarded-For can contain multiple IPs
            // e.g. "client, proxy1, proxy2"
            // First IP is the original client
            return forwardedFor.split(",")[0].trim();
        }

        // Direct connection — use remote address
        if (exchange.getRequest().getRemoteAddress() != null) {
            return exchange.getRequest()
                    .getRemoteAddress()
                    .getAddress()
                    .getHostAddress();
        }

        return "unknown";
    }

    // Returns 429 Too Many Requests response
    // Includes Retry-After header so client knows
    // when to try again — standard HTTP practice
    private Mono<Void> rateLimitResponse(ServerWebExchange exchange, long remaining) {
        exchange.getResponse()
                .setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse()
                .getHeaders()
                .setContentType(MediaType.APPLICATION_JSON);

        // Tell client to wait 60 seconds before retrying
        exchange.getResponse()
                .getHeaders()
                .add("Retry-After", "60");

        String body = """
                {
                  "status": 429,
                  "error": "Too Many Requests",
                  "message": "Rate limit exceeded. \
                Please wait 60 seconds before retrying.",
                  "retryAfter": 60
                }
                """;

        DataBuffer buffer = exchange.getResponse()
                .bufferFactory()
                .wrap(body.getBytes(
                        StandardCharsets.UTF_8));

        return exchange.getResponse()
                .writeWith(Mono.just(buffer));
    }
}
