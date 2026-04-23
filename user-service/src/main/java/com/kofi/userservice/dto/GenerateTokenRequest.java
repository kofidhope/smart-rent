package com.kofi.userservice.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class GenerateTokenRequest {
    private UUID userId;
    private String email;
    private String role;
}
