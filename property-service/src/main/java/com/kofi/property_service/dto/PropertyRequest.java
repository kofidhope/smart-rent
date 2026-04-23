package com.kofi.property_service.dto;

import com.kofi.property_service.model.PropertyType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PropertyRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Property type is required")
    private PropertyType type;

    @Min(value = 1, message = "Must have at least 1 bedroom")
    private Integer bedrooms;

    @Min(value = 1, message = "Must have at least 1 bathroom")
    private Integer bathrooms;
}
