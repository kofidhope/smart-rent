package com.kofi.booking_service.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PropertyResponse {
    private UUID id;
    private UUID ownerId;
    private String title;
    private String city;
    private String address;
    private BigDecimal price;
    private String status;
    private String type;
    private Integer bedrooms;
    private Integer bathrooms;
}
