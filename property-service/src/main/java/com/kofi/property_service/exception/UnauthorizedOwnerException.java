package com.kofi.property_service.exception;

public class UnauthorizedOwnerException extends RuntimeException {
    public UnauthorizedOwnerException(String message) {
        super(message);
    }
}
