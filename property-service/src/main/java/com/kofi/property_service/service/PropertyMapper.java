package com.kofi.property_service.service;

import com.kofi.property_service.dto.PropertyRequest;
import com.kofi.property_service.dto.PropertyResponse;
import com.kofi.property_service.dto.UserResponse;
import com.kofi.property_service.model.Property;
import com.kofi.property_service.model.PropertyStatus;
import org.springframework.stereotype.Component;

@Component
public class PropertyMapper {

    public Property toEntity(PropertyRequest request, java.util.UUID ownerId) {
        return Property.builder()
                .ownerId(ownerId)
                .title(request.getTitle())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .price(request.getPrice())
                .type(request.getType())
                .status(PropertyStatus.AVAILABLE)
                .bedrooms(request.getBedrooms())
                .bathrooms(request.getBathrooms())
                .build();
    }

    public PropertyResponse toResponse(Property property, UserResponse owner) {
        return PropertyResponse.builder()
                .id(property.getId())
                .ownerId(property.getOwnerId())
                .ownerName(owner.getFirstName() + " " + owner.getLastName())
                .title(property.getTitle())
                .description(property.getDescription())
                .address(property.getAddress())
                .city(property.getCity())
                .price(property.getPrice())
                .type(property.getType())
                .status(property.getStatus())
                .bedrooms(property.getBedrooms())
                .bathrooms(property.getBathrooms())
                .createdAt(property.getCreatedAt())
                .build();
    }
}
