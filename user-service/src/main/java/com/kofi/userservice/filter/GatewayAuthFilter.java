package com.kofi.userservice.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class GatewayAuthFilter extends OncePerRequestFilter {

    @Value("${gateway.internal-secret}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws IOException, ServletException {
        String path = request.getRequestURI();

        // Allow register/login and actuator without secret
        if (shouldBypass(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Enforce gateway secret for protected endpoints
        String receivedSecret = request.getHeader("X-Internal-Secret");
        if (receivedSecret == null || !internalSecret.equals(receivedSecret)) {
            log.warn("Access denied — path: {} ip: {}", path, request.getRemoteAddr());
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied");
            return;
        }

        // Populate security context if headers present
        String userIdHeader = request.getHeader("X-User-Id");
        String roleHeader   = request.getHeader("X-User-Role");

        if (userIdHeader != null && roleHeader != null) {
            try {
                UUID userId = UUID.fromString(userIdHeader);
                String role = roleHeader.toUpperCase(); // normalize casing

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        );

                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("Authenticated userId={} with role={}", userId, role);

            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID in X-User-Id header: {}", userIdHeader);
            }
        } else {
            log.warn("Missing authentication headers: X-User-Id or X-User-Role");
        }
        filterChain.doFilter(request, response);
    }

    private boolean shouldBypass(String path) {
        // Be flexible: match by contains rather than strict equals
        return path.startsWith("/actuator")
                || path.contains("/register")
                || path.contains("/login")
                || path.contains("/auth/**")
                || path.matches("/api/users/[0-9a-fA-F\\-]+"); // allow /api/users/{id}
    }
}
