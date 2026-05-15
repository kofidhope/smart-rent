package com.kofi.apigateway.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Component
@Order(-1)
@Slf4j
public class GatewayExceptionHandler implements ErrorWebExceptionHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {

        HttpStatus status = determineStatus(ex);
        String message = determineMessage(ex);
        String path = exchange.getRequest().getURI().getPath();

        // Log appropriately based on severity
        if (status.is5xxServerError()) {
            log.error("Gateway error — status: {} " + "path: {} error: {}", status.value(), path, ex.getMessage(), ex);
        } else {
            log.warn("Gateway client error — status: {} " + "path: {} error: {}", status.value(), path, ex.getMessage());
        }

        return writeErrorResponse(exchange, status, message, path);
    }

    // Determine HTTP status from exception type
    private HttpStatus determineStatus(Throwable ex) {

        if (ex instanceof ResponseStatusException rse) {
            return HttpStatus.valueOf(rse.getStatusCode().value());
        }

        // Service not found in Eureka or all instances down
        if (ex instanceof java.net.ConnectException || ex.getMessage() != null && ex.getMessage().contains("Connection refused")) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }

        // Timeout waiting for downstream service
        if (ex instanceof java.util.concurrent.TimeoutException) {
            return HttpStatus.GATEWAY_TIMEOUT;
        }

        // No route found for this path
        if (ex.getClass().getSimpleName().contains("NotFoundException")) {
            return HttpStatus.NOT_FOUND;
        }

        // Default — unexpected server error
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    // Build human-readable error message
    // Never expose internal exception details to client
    // Log the real exception — return safe message
    private String determineMessage(Throwable ex) {

        if (ex instanceof ResponseStatusException rse) {
            return rse.getReason() != null ? rse.getReason() : rse.getStatusCode().toString();
        }

        HttpStatus status = determineStatus(ex);

        return switch (status) {
            case SERVICE_UNAVAILABLE ->
                    "Service is temporarily unavailable. " + "Please try again shortly.";
            case GATEWAY_TIMEOUT ->
                    "Request timed out. " + "Please try again.";
            case NOT_FOUND ->
                    "The requested resource was not found.";
            default ->
                    "An unexpected error occurred. " + "Please try again.";
        };
    }

    // -------------------------------------------------------
    // Write JSON error response
    // -------------------------------------------------------
    private Mono<Void> writeErrorResponse(
            ServerWebExchange exchange,
            HttpStatus status,
            String message,
            String path) {

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse()
                .getHeaders()
                .setContentType(MediaType.APPLICATION_JSON);

        String body = String.format("""
                {
                  "timestamp": "%s",
                  "status": %d,
                  "error": "%s",
                  "message": "%s",
                  "path": "%s"
                }
                """,
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                path
        );

        DataBuffer buffer = exchange.getResponse()
                .bufferFactory()
                .wrap(body.getBytes(
                        StandardCharsets.UTF_8));

        return exchange.getResponse()
                .writeWith(Mono.just(buffer));
    }
}
