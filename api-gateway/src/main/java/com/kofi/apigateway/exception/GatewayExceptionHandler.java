package com.kofi.apigateway.exception;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        HttpStatus status = determineStatus(ex);
        String message = determineMessage(ex);
        String path = exchange.getRequest().getURI().getPath();

        // Log appropriately
        if (status.is5xxServerError()) {
            log.error("Gateway error — status: {} path: {} error: {}", status.value(), path, ex.getMessage(), ex);
        } else {
            log.warn("Gateway client error — status: {} path: {} error: {}", status.value(), path, ex.getMessage());
        }

        ApiError error = ApiError.of(
                status.value(),
                status.getReasonPhrase(),
                message,
                path
        );

        return writeErrorResponse(exchange, status, error);
    }

    private HttpStatus determineStatus(Throwable ex) {
        if (ex instanceof ResponseStatusException rse) {
            return HttpStatus.valueOf(rse.getStatusCode().value());
        }
        if (ex instanceof java.net.ConnectException ||
                (ex.getMessage() != null && ex.getMessage().contains("Connection refused"))) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }
        if (ex instanceof java.util.concurrent.TimeoutException) {
            return HttpStatus.GATEWAY_TIMEOUT;
        }
        if (ex.getClass().getSimpleName().contains("NotFoundException")) {
            return HttpStatus.NOT_FOUND;
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private String determineMessage(Throwable ex) {
        if (ex instanceof ResponseStatusException rse) {
            return rse.getReason() != null ? rse.getReason() : rse.getStatusCode().toString();
        }
        HttpStatus status = determineStatus(ex);
        return switch (status) {
            case SERVICE_UNAVAILABLE -> "Service is temporarily unavailable. Please try again shortly.";
            case GATEWAY_TIMEOUT -> "Request timed out. Please try again.";
            case NOT_FOUND -> "The requested resource was not found.";
            default -> "An unexpected error occurred. Please try again.";
        };
    }

    private Mono<Void> writeErrorResponse(ServerWebExchange exchange, HttpStatus status, ApiError error) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(error);
        } catch (JsonProcessingException e) {
            bytes = ("{\"status\":500,\"message\":\"Error serializing ApiError\"}").getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
