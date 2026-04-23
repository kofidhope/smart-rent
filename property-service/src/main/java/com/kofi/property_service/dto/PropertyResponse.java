package com.kofi.property_service.dto;

import com.kofi.property_service.model.PropertyStatus;
import com.kofi.property_service.model.PropertyType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PropertyResponse {
    private UUID id;
    private UUID ownerId;
    private String ownerName;   // fetched from user-service via Feign
    private String title;
    private String description;
    private String address;
    private String city;
    private BigDecimal price;
    private PropertyType type;
    private PropertyStatus status;
    private Integer bedrooms;
    private Integer bathrooms;
    private LocalDateTime createdAt;
}