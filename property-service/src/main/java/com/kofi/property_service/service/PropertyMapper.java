package com.kofi.property_service.service;

import com.kofi.property_service.dto.PropertyImageResponse;
import com.kofi.property_service.dto.PropertyRequest;
import com.kofi.property_service.dto.PropertyResponse;
import com.kofi.property_service.dto.UserResponse;
import com.kofi.property_service.model.Property;
import com.kofi.property_service.model.PropertyImage;
import com.kofi.property_service.model.PropertyStatus;
import com.kofi.property_service.repository.PropertyImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PropertyMapper {

    private final PropertyImageRepository imageRepository;

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

    // ── OVERLOADED METHOD FOR BULK / INTERNAL CALLS ───────
    public PropertyResponse toResponse(Property property) {
        return PropertyResponse.builder()
                .id(property.getId())
                .ownerId(property.getOwnerId())
                // ownerName is omitted here because we don't have user context
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

    public void updateEntity(Property property, PropertyRequest request) {
        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setPrice(request.getPrice());
        property.setType(request.getType());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());
    }

    public PropertyResponse toResponse(Property property, UserResponse owner) {

        // Fetch images — primary first
        List<PropertyImage> images = imageRepository
                .findByPropertyIdOrderByDisplayOrderAsc(property.getId());

        String primaryImageUrl = images.stream()
                .filter(PropertyImage::getIsPrimary)
                .map(PropertyImage::getImageUrl)
                .findFirst()
                .orElse(null);

        List<PropertyImageResponse> imageResponses =
                images.stream()
                        .map(img -> PropertyImageResponse
                                .builder()
                                .id(img.getId())
                                .propertyId(img.getPropertyId())
                                .imageUrl(img.getImageUrl())
                                .isPrimary(img.getIsPrimary())
                                .displayOrder(img.getDisplayOrder())
                                .createdAt(img.getCreatedAt())
                                .build())
                        .toList();

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
                .primaryImageUrl(primaryImageUrl)
                .images(imageResponses)
                .build();
    }
}
