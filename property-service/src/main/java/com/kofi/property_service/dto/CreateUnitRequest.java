package com.kofi.property_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateUnitRequest {

    @NotBlank(message = "Unit name is required")
    private String name;

    private String description;

    // null = use property price
    private BigDecimal priceOverride;

    // null = use property bedrooms
    private Integer bedroomsOverride;

    // null = use property bathrooms
    private Integer bathroomsOverride;
}
