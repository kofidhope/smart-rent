package com.kofi.userservice.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(UserNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        404,
                        "Not Found",
                        ex.getMessage(),
                        request.getRequestURI()));
    }

    @ExceptionHandler(DuplicateUserException.class)
    public ResponseEntity<ApiError> handleDuplicate(DuplicateUserException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.of(
                        409,
                        "Conflict",
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
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of(
                        500,
                        "Internal Server Error",
                        "An unexpected error occurred",
                        request.getRequestURI()));
    }
}

