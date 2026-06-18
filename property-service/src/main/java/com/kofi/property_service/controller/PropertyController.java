package com.kofi.property_service.controller;

import com.kofi.property_service.dto.PageResponse;
import com.kofi.property_service.dto.PropertyRequest;
import com.kofi.property_service.dto.PropertyResponse;
import com.kofi.property_service.dto.PropertySearchRequest;
import com.kofi.property_service.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    // ── Public — no auth needed
    @GetMapping("/search")
    public ResponseEntity<PageResponse<PropertyResponse>> search(
            PropertySearchRequest request,
            @RequestParam(defaultValue = "0")
            int page,
            @RequestParam(defaultValue = "10")
            int size)
    {
        return ResponseEntity.ok(propertyService.searchProperties(request, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getProperty(@PathVariable UUID id) {
        return ResponseEntity.ok(propertyService.getPropertyById(id));
    }

    // ── Landlord only
    @PreAuthorize("hasRole('LANDLORD')")
    @PostMapping
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @RequestBody PropertyRequest request,
            @RequestHeader("X-User-Id") UUID ownerId) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(propertyService.createProperty(request, ownerId));
    }

    @PreAuthorize("hasRole('LANDLORD')")
    @GetMapping("/my")
    public ResponseEntity<List<PropertyResponse>> myProperties(
            @RequestHeader("X-User-Id") UUID ownerId) {
        return ResponseEntity.ok(propertyService.getMyProperties(ownerId));
    }

    @PreAuthorize("hasRole('LANDLORD')")
    @PutMapping("/{id}")
    public ResponseEntity<PropertyResponse> updateProperty(
            @PathVariable UUID id,
            @Valid @RequestBody PropertyRequest request,
            @RequestHeader("X-User-Id") UUID requesterId) {
        return ResponseEntity.ok(propertyService.updateProperty(id, request, requesterId));
    }

    @PreAuthorize("hasRole('LANDLORD')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID requesterId) {
        propertyService.deleteProperty(id, requesterId);
        return ResponseEntity.noContent().build();
    }

    // ── Internal — booking saga and service call these ───────────
    // No @PreAuthorize — permitAll in SecurityConfig

    @GetMapping("/bulk")
    public ResponseEntity<PageResponse<PropertyResponse>> getPropertiesByIds(
            @RequestParam("ids") List<UUID> ids,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(propertyService.getPropertiesByIds(ids, page, size));
    }


    @PutMapping("/{id}/status/rent")
    public ResponseEntity<Void> markAsRented(@PathVariable UUID id) {
        propertyService.markAsRented(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status/available")
    public ResponseEntity<Void> markAsAvailable(@PathVariable UUID id) {
        propertyService.markAsAvailable(id);
        return ResponseEntity.noContent().build();
    }
}