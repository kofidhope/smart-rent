package com.kofi.property_service.dto;

import com.kofi.property_service.model.PropertyType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PropertySearchRequest {
    private String city;
    private PropertyType type;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Integer minBedrooms;
}
