package com.kofi.property_service.exception;

import lombok.Getter;

/**
 * Exception thrown for business rule violations and validation failures
 * in the property service. Maps to HTTP 400 Bad Request.
 */
@Getter
public class PropertyBusinessException extends RuntimeException {
    public PropertyBusinessException(String message) {
        super(message);
    }
}
