package com.kofi.property_service.service;

import com.kofi.property_service.client.UserServiceClient;
import com.kofi.property_service.dto.*;
import com.kofi.property_service.exception.PropertyNotFoundException;
import com.kofi.property_service.exception.UnauthorizedOwnerException;
import com.kofi.property_service.model.Property;
import com.kofi.property_service.model.PropertyStatus;
import com.kofi.property_service.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserServiceClient userServiceClient;
    private final PropertyMapper mapper;
    private final UnitService unitService;

    @Transactional
    public PropertyResponse createProperty(PropertyRequest request, UUID ownerId) {
        // Verify owner exists in user-service before creating
        UserResponse owner = userServiceClient.getUserById(ownerId);

        // Check role
        if (!"LANDLORD".equalsIgnoreCase(owner.getRole())) {
            throw new UnauthorizedOwnerException("Only landlords can create properties");
        }

        Property property = mapper.toEntity(request, ownerId);
        Property saved = propertyRepository.save(property);

        log.info("Property created: {} by owner: {}", saved.getId(), ownerId);
        // ── NEW: create default unit ──────────────────────
        // Every new property gets one unit automatically
        // Landlord can add more units later
        unitService.createDefaultUnit(saved);
        return mapper.toResponse(saved, owner);
    }

    @Transactional(readOnly = true)
    public PropertyResponse getPropertyById(UUID id) {
        Property property = findOrThrow(id);
        UserResponse owner = userServiceClient.getUserById(property.getOwnerId());
        return mapper.toResponse(property, owner);
    }

    @Transactional(readOnly = true)
    public PageResponse<PropertyResponse> getPropertiesByIds(List<UUID> ids, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        // Fetch entities
        Page<Property> propertiesPage = propertyRepository.findAllByIdIn(ids, pageable);
        // Convert to Page<PropertyResponse>
        Page<PropertyResponse> dtoPage = propertiesPage.map(mapper::toResponse);
        // Now pass the DTO page to your PageResponse.of()
        return PageResponse.of(dtoPage);
    }
    
    @Transactional(readOnly = true)
    public PageResponse<PropertyResponse> searchProperties(PropertySearchRequest request, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        String city = request.getCity();
        if (city != null && city.isBlank()) {
            city = null;
        }

        String type = request.getType() != null ? request.getType().name() : null;

        boolean noFilters = city == null
                && type == null
                && request.getMinPrice() == null
                && request.getMaxPrice() == null
                && request.getMinBedrooms() == null;

        Page<Property> propertyPage = noFilters
                ? propertyRepository.findByStatus(PropertyStatus.AVAILABLE, pageable)
                : propertyRepository.searchProperties(
                        city,
                        type,
                        request.getMinPrice(),
                        request.getMaxPrice(),
                        request.getMinBedrooms(),
                        pageable
                );

        Page<PropertyResponse> responsePage = propertyPage.map(this::toResponseSafe);
        return PageResponse.of(responsePage);
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> getMyProperties(UUID ownerId) {
        // Landlords should see all their properties (available, rented, etc.)
        return propertyRepository
                .findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(this::toResponseSafe)
                .toList();
    }

    private PropertyResponse toResponseSafe(Property property) {
        UserResponse owner;
        try {
            owner = userServiceClient.getUserById(property.getOwnerId());
        } catch (Exception ex) {
            log.warn("Could not load owner {} for property {}: {}",
                    property.getOwnerId(), property.getId(), ex.getMessage());
            owner = null;
        }

        if (owner == null) {
            owner = new UserResponse();
            owner.setId(property.getOwnerId());
            owner.setFirstName("Unknown");
            owner.setLastName("Owner");
            owner.setEmail("");
        }

        return mapper.toResponse(property, owner);
    }

    @Transactional
    public PropertyResponse updateProperty(UUID id, PropertyRequest request, UUID requesterId) {
        Property property = findOrThrow(id);

        // Fetch requester once and reuse
        UserResponse requester = userServiceClient.getUserById(requesterId);

        if (!property.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedOwnerException("You do not own this property");
        }
        if (!"LANDLORD".equalsIgnoreCase(requester.getRole())) {
            throw new UnauthorizedOwnerException("Only landlords can update");
        }

        // Use mapper for consistency (optional improvement)
        mapper.updateEntity(property, request);

        Property updated = propertyRepository.save(property);
        return mapper.toResponse(updated, requester);
    }

    @Transactional
    public void deleteProperty(UUID id, UUID requesterId) {
        Property property = findOrThrow(id);

        if (!property.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedOwnerException("You do not own this property");
        }

        UserResponse requester = userServiceClient.getUserById(requesterId);
        if (!"LANDLORD".equalsIgnoreCase(requester.getRole())) {
            throw new UnauthorizedOwnerException("Only landlords can update/delete properties");
        }


        // Soft delete — mark as unlisted, never hard delete
        property.setStatus(PropertyStatus.UNLISTED);
        propertyRepository.save(property);
        log.info("Property {} unlisted by owner {}", id, requesterId);
    }

    @Transactional
    public void markAsRented(UUID id) {
        Property property = findOrThrow(id);
        property.setStatus(PropertyStatus.RENTED);
        propertyRepository.save(property);
        log.info("Property {} marked as RENTED by booking saga", id);
    }

    @Transactional
    public void markAsAvailable(UUID id) {
        Property property = findOrThrow(id);
        property.setStatus(PropertyStatus.AVAILABLE);
        propertyRepository.save(property);
        log.info("Property {} marked as AVAILABLE by booking saga", id);
    }

    private Property findOrThrow(UUID id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new PropertyNotFoundException("Property not found: " + id));
    }
}