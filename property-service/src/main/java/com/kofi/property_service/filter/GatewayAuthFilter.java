package com.kofi.property_service.filter;


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

@Component
@Slf4j
public class GatewayAuthFilter extends OncePerRequestFilter {

    @Value("${gateway.internal-secret}")
    private String internalSecret;

    // Paths that bypass the internal secret check
    private static final List<String> BYPASS_PATHS = List.of(
            "/actuator/health",
            "/actuator/info",
            // Internal saga calls from booking-service
            "/api/properties/status",
            // Paystack webhook
            "/api/payments/webhook"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip secret check for internal/public paths
        if (shouldBypass(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Verify request came through gateway
        String receivedSecret = request.getHeader("X-Internal-Secret");

        if (!internalSecret.equals(receivedSecret)) {
            log.warn("Direct access attempt rejected — " + "path: {} ip: {}", path, request.getRemoteAddr());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Access denied\"}");
            return;
        }

        // Read gateway-injected headers
        String userId = request.getHeader("X-User-Id");
        String role = request.getHeader("X-User-Role");

        // Populate Spring Security context
        // @PreAuthorize reads from here
        if (userId != null && role != null) {
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        filterChain.doFilter(request, response);
    }

    private boolean shouldBypass(String path) {
        return BYPASS_PATHS.stream().anyMatch(path::contains);
    }
}

