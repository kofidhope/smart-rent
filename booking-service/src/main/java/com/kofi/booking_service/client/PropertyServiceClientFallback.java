package com.kofi.booking_service.client;

import com.kofi.booking_service.dto.PropertyResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
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
    public List<PropertyResponse> getPropertiesByIds(List<UUID> ids) {
        log.warn("Fallback: property-service unavailable. " +
                "Could not fetch bulk properties for IDs: {}", ids);
        // Return an empty list instead of null to protect downstream streams/maps
        return List.of();
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
