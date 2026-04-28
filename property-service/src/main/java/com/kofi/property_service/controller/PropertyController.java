package com.kofi.property_service.controller;

import com.kofi.property_service.dto.PropertyRequest;
import com.kofi.property_service.dto.PropertyResponse;
import com.kofi.property_service.dto.PropertySearchRequest;
import com.kofi.property_service.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @RequestBody PropertyRequest request,
            @RequestHeader("X-User-Id") UUID ownerId) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(propertyService.createProperty(request, ownerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getProperty(@PathVariable UUID id) {
        return ResponseEntity.ok(propertyService.getPropertyById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<PropertyResponse>> search(
            PropertySearchRequest request) {
        return ResponseEntity.ok(propertyService.searchProperties(request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<PropertyResponse>> myProperties(
            @RequestHeader("X-User-Id") UUID ownerId) {
        return ResponseEntity.ok(propertyService.getMyProperties(ownerId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PropertyResponse> updateProperty(
            @PathVariable UUID id,
            @Valid @RequestBody PropertyRequest request,
            @RequestHeader("X-User-Id") UUID requesterId) {
        return ResponseEntity.ok(
                propertyService.updateProperty(id, request, requesterId));
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID requesterId) {
        propertyService.deleteProperty(id, requesterId);
        return ResponseEntity.noContent().build();
    }
}