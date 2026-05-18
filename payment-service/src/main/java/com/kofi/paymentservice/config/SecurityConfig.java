package com.kofi.paymentservice.config;

import com.kofi.paymentservice.filter.GatewayAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final GatewayAuthFilter gatewayAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ── Actuator
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info")
                        .permitAll()

                        // ── Paystack webhook ──────────────────
                        // External call from Paystack servers
                        // No JWT, no X-User-Role, no internal
                        // secret — Paystack is not your service
                        // Paystack authenticates via HMAC
                        // signature on the request body instead
                        .requestMatchers(HttpMethod.POST,
                                "/api/payments/webhook")
                        .permitAll()

                        // ── Everything else
                        .anyRequest().authenticated()
                )
                .addFilterBefore(gatewayAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}