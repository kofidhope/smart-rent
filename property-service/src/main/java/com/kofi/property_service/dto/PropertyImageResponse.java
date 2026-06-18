package com.kofi.property_service.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PropertyImageResponse {
    private UUID id;
    private UUID propertyId;
    private String imageUrl;
    private boolean isPrimary;
    private int displayOrder;
    private LocalDateTime createdAt;
}
