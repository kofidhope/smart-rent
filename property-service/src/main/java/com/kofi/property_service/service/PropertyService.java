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

        if (!property.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedOwnerException("You do not own this property");
        }

        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setPrice(request.getPrice());
        property.setType(request.getType());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());

        Property updated = propertyRepository.save(property);
        UserResponse owner = userServiceClient.getUserById(requesterId);
        return mapper.toResponse(updated, owner);
    }

    @Transactional
    public void deleteProperty(UUID id, UUID requesterId) {
        Property property = findOrThrow(id);

        if (!property.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedOwnerException("You do not own this property");
        }

        // Soft delete — mark as unlisted, never hard delete
        property.setStatus(PropertyStatus.UNLISTED);
        propertyRepository.save(property);
        log.info("Property {} unlisted by owner {}", id, requesterId);
    }

    private Property findOrThrow(UUID id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new PropertyNotFoundException("Property not found: " + id));
    }
}