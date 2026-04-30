package com.kofi.booking_service.client;

import com.kofi.booking_service.dto.PropertyResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.UUID;

@FeignClient(
        name = "property-service",
        fallback = PropertyServiceClientFallback.class
)
public interface PropertyServiceClient {

    @GetMapping("/api/properties/{id}")
    PropertyResponse getPropertyById(@PathVariable UUID id);

    @PutMapping("/api/properties/{id}/status/rent")
    void markAsRented(@PathVariable UUID id);

    @PutMapping("/api/properties/{id}/status/available")
    void markAsAvailable(@PathVariable UUID id);
}
