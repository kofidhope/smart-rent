package com.kofi.property_service.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
@Slf4j
public class FeignClientInterceptor implements RequestInterceptor {

    @Value("${gateway.internal-secret}")
    private String internalSecret;

    @Override
    public void apply(RequestTemplate template) {

        // ── Always inject internal secret ─────────────────
        // Tells downstream services this call came from
        // a trusted internal service not a direct client
        // This is injected whether there is an
        // active HTTP request context
        template.header("X-Internal-Secret", internalSecret);

        // ── Forward user context if available ─────────────
        // Only exists when called from a REST endpoint
        // Does NOT exist when called from Kafka listener
        // e.g. booking-service saga calling property-service
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes != null) {

            HttpServletRequest request = attributes.getRequest();

//            // Forward JWT
//            String authHeader = request.getHeader("Authorization");
//            if (authHeader != null && authHeader.startsWith("Bearer ")) {
//                template.header("Authorization", authHeader);
//            }

            // Forward verified user identity headers
            // These were injected by the gateway
            String userId = request.getHeader("X-User-Id");
            String role = request.getHeader("X-User-Role");
            String email = request.getHeader("X-User-Email");

            if (userId != null) {
                template.header("X-User-Id", userId);
            }
            if (role != null) {
                template.header("X-User-Role", role);
            }
            if (email != null) {
                template.header("X-User-Email", email);
            }

        } else {
            // Called from Kafka listener — no HTTP context
            // X-Internal-Secret already injected above
            // Downstream service accepts it via shouldBypass
            // or because secret check passes
            log.debug("Feign call from non-HTTP context " + "(Kafka listener) — " + "only X-Internal-Secret injected " + "for: {}",
                    template.url());
        }
    }
}