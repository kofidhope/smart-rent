package com.kofi.property_service.dto;

import com.kofi.property_service.model.PropertyStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class UnitResponse {
    private UUID id;
    private UUID propertyId;
    private String name;
    private String description;
    private BigDecimal effectivePrice;
    private int effectiveBedrooms;
    private int effectiveBathrooms;
    private BigDecimal priceOverride;
    private Integer bedroomsOverride;
    private Integer bathroomsOverride;
    private PropertyStatus status;
    private int displayOrder;
}
