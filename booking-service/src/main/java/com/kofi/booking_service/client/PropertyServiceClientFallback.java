package com.kofi.booking_service.client;

import com.kofi.booking_service.dto.PropertyResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class PropertyServiceClientFallback implements PropertyServiceClient {

    @Override
    public PropertyResponse getPropertyById(UUID id) {
        log.warn("Fallback: property-service unavailable. " +
                "Could not fetch property {}", id);
        return null;
    }

    @Override
    public void markAsRented(UUID id) {
        log.error("CRITICAL fallback: property-service unavailable. " +
                "Property {} NOT marked as rented. " +
                "Manual intervention required.", id);
    }

    @Override
    public void markAsAvailable(UUID id) {
        log.error("CRITICAL fallback: property-service unavailable. " +
                "Property {} NOT marked as available. " +
                "Manual intervention required.", id);
    }
}
