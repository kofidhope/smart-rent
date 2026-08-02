package com.kofi.booking_service.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
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
    private String status;
    private int displayOrder;
}
