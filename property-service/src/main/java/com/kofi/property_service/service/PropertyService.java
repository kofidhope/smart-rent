package com.kofi.property_service.service;

import com.kofi.property_service.client.UserServiceClient;
import com.kofi.property_service.dto.PropertyRequest;
import com.kofi.property_service.dto.PropertyResponse;
import com.kofi.property_service.dto.PropertySearchRequest;
import com.kofi.property_service.dto.UserResponse;
import com.kofi.property_service.exception.PropertyNotFoundException;
import com.kofi.property_service.exception.UnauthorizedOwnerException;
import com.kofi.property_service.model.Property;
import com.kofi.property_service.model.PropertyStatus;
import com.kofi.property_service.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
        return mapper.toResponse(saved, owner);
    }

    @Transactional(readOnly = true)
    public PropertyResponse getPropertyById(UUID id) {
        Property property = findOrThrow(id);
        UserResponse owner = userServiceClient.getUserById(property.getOwnerId());
        return mapper.toResponse(property, owner);
    }

    public List<PropertyResponse> getPropertiesByIds(List<UUID> ids) {
        return propertyRepository.findAllById(ids).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> searchProperties(PropertySearchRequest request) {
        return propertyRepository.searchProperties(
                        request.getCity(),
                        request.getType(),
                        request.getMinPrice(),
                        request.getMaxPrice(),
                        request.getMinBedrooms()
                ).stream()
                .map(p -> {
                    UserResponse owner = userServiceClient.getUserById(p.getOwnerId());
                    return mapper.toResponse(p, owner);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> getMyProperties(UUID ownerId) {
        return propertyRepository
                .findByOwnerIdAndStatus(ownerId, PropertyStatus.AVAILABLE)
                .stream()
                .map(p -> mapper.toResponse(p, userServiceClient.getUserById(ownerId)))
                .toList();
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