package com.kofi.property_service.exception;

import lombok.Getter;

/**
 * Exception thrown when a user attempts to modify a property they do not own.
 * Maps to HTTP 403 Forbidden.
 */
@Getter
public class UnauthorizedOwnerException extends RuntimeException {
    public UnauthorizedOwnerException(String message) {
        super(message);
    }
}
