package com.kofi.property_service.controller;

import com.kofi.property_service.dto.CreateUnitRequest;
import com.kofi.property_service.dto.UnitResponse;
import com.kofi.property_service.service.UnitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/properties/{propertyId}/units")
@RequiredArgsConstructor
public class UnitController {

    private final UnitService unitService;

    // Public — anyone browsing can see units
    @GetMapping
    public ResponseEntity<List<UnitResponse>> getUnits(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(unitService.getUnitsForProperty(propertyId));
    }

    // Public — get single unit detail
    @GetMapping("/{unitId}")
    public ResponseEntity<UnitResponse> getUnit(@PathVariable UUID propertyId, @PathVariable UUID unitId) {
        return ResponseEntity.ok(unitService.getUnit(unitId));
    }

    // LANDLORD only — add a unit to their property
    @PreAuthorize("hasRole('LANDLORD')")
    @PostMapping
    public ResponseEntity<UnitResponse> addUnit(@PathVariable UUID propertyId, @Valid @RequestBody CreateUnitRequest request, @RequestHeader("X-User-Id") UUID ownerId) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(unitService.addUnit(propertyId, ownerId, request));
    }

    // LANDLORD only — delete a unit
    @PreAuthorize("hasRole('LANDLORD')")
    @DeleteMapping("/{unitId}")
    public ResponseEntity<Void> deleteUnit(@PathVariable UUID propertyId, @PathVariable UUID unitId, @RequestHeader("X-User-Id") UUID ownerId) {

        unitService.deleteUnit(unitId, ownerId);
        return ResponseEntity.noContent().build();
    }

    // ── Internal — called by booking saga ─────────────
    // No @PreAuthorize — permitAll in SecurityConfig
    @PutMapping("/{unitId}/status/rent")
    public ResponseEntity<Void> markAsRented(@PathVariable UUID propertyId, @PathVariable UUID unitId) {
        unitService.markUnitAsRented(unitId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{unitId}/status/available")
    public ResponseEntity<Void> markAsAvailable(@PathVariable UUID propertyId, @PathVariable UUID unitId) {
        unitService.markUnitAsAvailable(unitId);
        return ResponseEntity.noContent().build();
    }
}
