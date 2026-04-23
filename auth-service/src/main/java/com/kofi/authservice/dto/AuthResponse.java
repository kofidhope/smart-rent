package com.kofi.authservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private UUID userId;
    private String accessToken;
    private String refreshToken;
    private String role;
}
