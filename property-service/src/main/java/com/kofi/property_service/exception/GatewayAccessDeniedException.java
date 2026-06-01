package com.kofi.property_service.exception;

public class GatewayAccessDeniedException extends RuntimeException {
    public GatewayAccessDeniedException(String message) {
        super(message);
    }
}
