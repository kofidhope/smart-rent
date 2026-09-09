package com.kofi.property_service.exception;

import lombok.Getter;

/**
 * Exception thrown when image upload to the external provider (Cloudinary) fails.
 * Maps to HTTP 500 Internal Server Error but provides a specific reason.
 */
@Getter
public class PropertyUploadException extends RuntimeException {
    public PropertyUploadException(String message) {
        super(message);
    }

    public PropertyUploadException(String message, Throwable cause) {
        super(message, cause);
    }
}
