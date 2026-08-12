package com.kofi.booking_service.client;

import com.kofi.booking_service.dto.PropertyResponse;
import com.kofi.booking_service.dto.UnitResponse;
import com.kofi.booking_service.exception.PropertyNotAvailableException;
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

    // Gets the first unit — default for single-unit properties.
    //
    // Throws PropertyNotAvailableException (mapped to HTTP 409 by
    // GlobalExceptionHandler) when the units list is empty. Two
    // distinct causes collapse into the same typed exception:
    //   1. Property really has no bookable units (config error
    //      or property.status != AVAILABLE) — message reflects
    //      that directly.
    //   2. PropertyServiceClientFallback returned an empty list
    //      because property-service was unreachable. Caller can
    //      tell which from the failureReason persisted on the
    //      booking record.
    default UnitResponse getDefaultUnit(UUID propertyId) {
        List<UnitResponse> units = getUnitsForProperty(propertyId);
        if (units == null || units.isEmpty()) {
            throw new PropertyNotAvailableException(
                    "No units available for property: " + propertyId);
        }
        return units.get(0);
    }
}