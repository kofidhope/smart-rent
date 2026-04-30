package com.kofi.booking_service.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class UserResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
}
