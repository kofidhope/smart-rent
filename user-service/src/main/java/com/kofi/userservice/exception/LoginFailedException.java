package com.kofi.userservice.exception;

import lombok.Getter;

/**
 * Exception thrown when authentication fails (e.g., wrong password, user not found).
 * Maps to HTTP 401 Unauthorized.
 */
@Getter
public class LoginFailedException extends RuntimeException {
    public LoginFailedException(String message) {
        super(message);
    }
}
