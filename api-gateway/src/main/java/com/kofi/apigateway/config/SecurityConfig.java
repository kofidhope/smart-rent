package com.kofi.apigateway.config;

import com.kofi.apigateway.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final GatewayConfig gatewayConfig;

    // Reactive security chain
    // NOTE: This is ServerHttpSecurity not HttpSecurity
    // NOTE: Returns SecurityWebFilterChain not SecurityFilterChain
    // The reactive equivalents — gateway uses WebFlux
    // JWT validation is handled by JwtAuthenticationFilter
    // not by Spring Security — Spring Security is used
    // only for basic protection and CSRF disable here
    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {

        http
                // ── Disable CSRF ──────────────────────────────
                // REST APIs are stateless — no sessions
                // CSRF protection is for session-based apps
                // JWT in Authorization header already prevents
                // CSRF attacks — tokens cannot be read
                // cross-origin due to browser same-origin policy
                .csrf(ServerHttpSecurity.CsrfSpec::disable)

                // ── Disable form login ────────────────────────
                // No login page — JWT handles authentication
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)

                // ── Disable HTTP Basic ────────────────────────
                // No username/password prompts
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)

                // ── Authorization rules ───────────────────────
                // Keep these minimal — JwtAuthenticationFilter
                // already handles authentication and injections
                // Spring Security rules here are a second layer
                // of protection, not the primary mechanism
                .authorizeExchange(exchanges -> exchanges

                        // Public endpoints — no auth needed
                        .pathMatchers(HttpMethod.POST,
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/refresh")
                        .permitAll()

                        // Public GET — property search and view
                        .pathMatchers(HttpMethod.GET,
                                "/api/properties/search",
                                "/api/properties/{id}")
                        .permitAll()

                        // Paystack webhook — external service
                        .pathMatchers(HttpMethod.POST, "/api/payments/webhook")
                        .permitAll()

                        // Actuator health — Docker needs this
                        .pathMatchers(
                                "/actuator/health",
                                "/actuator/info")
                        .permitAll()

                        // Preflight OPTIONS — browser CORS check
                        // Must be permitted before JWT filter
                        // sees it — no token on preflight
                        .pathMatchers(HttpMethod.OPTIONS, "/**")
                        .permitAll()

                        // Everything else requires authentication
                        .anyExchange().authenticated()
                );

        return http.build();
    }
}
