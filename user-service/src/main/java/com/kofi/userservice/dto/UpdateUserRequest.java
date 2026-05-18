package com.kofi.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Pattern(
            regexp = "^(0[0-9]{9}|\\+?233[0-9]{8})$",
            message = "Phone number must be a valid Ghanaian number e.g. 0241234567 or +233241234567"
    )
    private String phoneNumber;;
}

