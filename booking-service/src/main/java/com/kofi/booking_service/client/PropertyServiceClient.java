package com.kofi.booking_service.client;

import com.kofi.booking_service.dto.PropertyResponse;
import com.kofi.booking_service.dto.UnitResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(
        name = "property-service",
        fallback = PropertyServiceClientFallback.class
)
public interface PropertyServiceClient {

    @GetMapping("/api/properties/{id}")
    PropertyResponse getPropertyById(@PathVariable UUID id);

    //BULK ENDPOINT
    @GetMapping("/api/properties/bulk")
    List<PropertyResponse> getPropertiesByIds(@RequestParam("ids") List<UUID> ids);

    @PutMapping("/api/properties/{id}/status/rent")
    void markAsRented(@PathVariable UUID id);

    @PutMapping("/api/properties/{id}/status/available")
    void markAsAvailable(@PathVariable UUID id);

    @GetMapping("/api/properties/{propertyId}/units")
    List<UnitResponse> getUnitsForProperty(@PathVariable UUID propertyId);

    // Gets the first unit — default for single-unit properties
    default UnitResponse getDefaultUnit(UUID propertyId) {
        List<UnitResponse> units = getUnitsForProperty(propertyId);
        if (units == null || units.isEmpty()) {
            throw new RuntimeException("No units found for property: " + propertyId);
        }
        return units.get(0);
    }
}