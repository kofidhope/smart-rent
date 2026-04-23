package com.kofi.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class TokenRequest {
    private UUID userId;
    private String email;
    private String role;
}
