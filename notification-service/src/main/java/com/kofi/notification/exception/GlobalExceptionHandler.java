package com.kofi.notification.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NotificationNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(NotificationNotFoundException ex, HttpServletRequest request) {
        log.warn("Notification not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        404,
                        "Not Found",
                        ex.getMessage(),
                        request.getRequestURI()));
    }

    @ExceptionHandler(NotificationDeliveryException.class)
    public ResponseEntity<ApiError> handleDelivery(NotificationDeliveryException ex, HttpServletRequest request) {
        log.error("Notification delivery failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiError.of(
                        502,
                        "Delivery Failed",
                        ex.getMessage(),
                        request.getRequestURI()));
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedAccessException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiError.of(
                        403,
                        "Forbidden",
                        ex.getMessage(),
                        request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneral(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error in notification-service: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of(
                        500,
                        "Internal Server Error",
                        "An unexpected error occurred",
                        request.getRequestURI()));
    }
}

