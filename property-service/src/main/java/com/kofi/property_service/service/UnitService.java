package com.kofi.property_service.service;

import com.kofi.property_service.dto.CreateUnitRequest;
import com.kofi.property_service.dto.UnitResponse;
import com.kofi.property_service.exception.ConflictException;
import com.kofi.property_service.exception.ResourceNotFoundException;
import com.kofi.property_service.model.Property;
import com.kofi.property_service.model.PropertyStatus;
import com.kofi.property_service.model.Unit;
import com.kofi.property_service.repository.PropertyRepository;
import com.kofi.property_service.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UnitService {

    private final UnitRepository unitRepository;
    private final PropertyRepository propertyRepository;

    // ── Get all units for a property ──────────────────
    @Transactional(readOnly = true)
    public List<UnitResponse> getUnitsForProperty(UUID propertyId) {

        if (!propertyRepository.existsById(propertyId)) {
            throw new ResourceNotFoundException("Property not found: " + propertyId);
        }

        return unitRepository
                .findByPropertyIdOrderByDisplayOrderAsc(propertyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    //  Get single unit
    @Transactional(readOnly = true)
    public UnitResponse getUnit(UUID unitId) {
        return toResponse(findOrThrow(unitId));
    }

    // ── Add unit to property — LANDLORD only
    @Transactional
    public UnitResponse addUnit(UUID propertyId, UUID ownerId, CreateUnitRequest request) {

        Property property = propertyRepository
                .findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + propertyId));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new ConflictException("You do not own this property");
        }

        long currentCount = unitRepository.countByPropertyId(propertyId);

        Unit unit = Unit.builder()
                .property(property)
                .name(request.getName())
                .description(request.getDescription())
                .priceOverride(request.getPriceOverride())
                .bedroomsOverride(request.getBedroomsOverride())
                .bathroomsOverride(request.getBathroomsOverride())
                .displayOrder((int) currentCount)
                .build();

        Unit saved = unitRepository.save(unit);

        log.info("Unit added — propertyId: {} " + "unitId: {} name: {}", propertyId, saved.getId(), saved.getName());

        return toResponse(saved);
    }

    // ── Delete unit — LANDLORD only ───────────────────
    @Transactional
    public void deleteUnit(UUID unitId, UUID ownerId) {

        Unit unit = findOrThrow(unitId);

        if (!unit.getProperty().getOwnerId().equals(ownerId)) {
            throw new ConflictException("You do not own this property");
        }

        // Cannot delete if it is the only unit
        long count = unitRepository.countByPropertyId(unit.getProperty().getId());

        if (count <= 1) {
            throw new ConflictException("Cannot delete the last unit. " + "A property must have at least " + "one unit.");
        }

        unitRepository.delete(unit);

        log.info("Unit deleted — unitId: {}", unitId);
    }

    // ── Mark unit as rented — called by booking saga ──
    // This replaces the old markAsRented on Property
    // for single-unit properties
    @Transactional
    public void markUnitAsRented(UUID unitId) {
        unitRepository.updateStatus(unitId, PropertyStatus.RENTED);

        log.info("Unit marked RENTED — unitId: {}", unitId);
    }

    // ── Mark unit as available — booking cancelled ────
    @Transactional
    public void markUnitAsAvailable(UUID unitId) {
        unitRepository.updateStatus(unitId, PropertyStatus.AVAILABLE);

        log.info("Unit marked AVAILABLE — unitId: {}", unitId);
    }

    // ── Get default unit for a property ───────────────
    // Backwards compatibility — when only propertyId
    // is known, return the first available unit
    @Transactional(readOnly = true)
    public Unit getDefaultUnit(UUID propertyId) {
        return unitRepository
                .findFirstByPropertyIdOrderByDisplayOrderAsc(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("No units found for " + "property: " + propertyId));
    }

    // ── Auto-create default unit on property create ───
    // Called by PropertyService after saving a property
    @Transactional
    public Unit createDefaultUnit(Property property) {
        Unit unit = Unit.builder()
                .property(property)
                .name("Whole Property")
                .description(property.getDescription())
                .displayOrder(0)
                .build();

        Unit saved = unitRepository.save(unit);

        log.info("Default unit created for " + "propertyId: {}", property.getId());

        return saved;
    }

    // ── Private helpers ───────────────────────────────
    private Unit findOrThrow(UUID unitId) {
        return unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found: " + unitId));
    }

    public UnitResponse toResponse(Unit unit) {
        return UnitResponse.builder()
                .id(unit.getId())
                .propertyId(unit.getProperty().getId())
                .name(unit.getName())
                .description(unit.getDescription())
                .effectivePrice(unit.getEffectivePrice())
                .effectiveBedrooms(unit.getEffectiveBedrooms())
                .effectiveBathrooms(unit.getEffectiveBathrooms())
                .priceOverride(unit.getPriceOverride())
                .bedroomsOverride(unit.getBedroomsOverride())
                .bathroomsOverride(unit.getBathroomsOverride())
                .status(unit.getStatus())
                .displayOrder(unit.getDisplayOrder())
                .build();
    }
}
