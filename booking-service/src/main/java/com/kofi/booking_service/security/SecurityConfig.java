package com.kofi.booking_service.security;

import com.kofi.booking_service.filter.GatewayAuthFilter;
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

                        // ── Internal scheduler call ───────────
                        // completeBooking is called by a
                        // scheduled job inside payment-service
                        // not by a user — no role header
                        .requestMatchers(HttpMethod.PATCH,
                                "/api/bookings/*/complete")
                        .permitAll()

                        // ── Internal saga calls ───────────────
                        // payment-service calls these via Feign
                        // from inside a Kafka listener context
                        // no active HTTP request — no role header
                        // booking-service saga compensation
                        .requestMatchers(HttpMethod.GET,
                                "/api/bookings/*/saga")
                        .permitAll()

                        // ── Everything else ───────────────────
                        .anyRequest().authenticated()
                )
                .addFilterBefore(gatewayAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
