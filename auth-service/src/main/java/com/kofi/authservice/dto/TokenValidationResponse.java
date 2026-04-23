package com.kofi.authservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TokenValidationResponse {
    private UUID userId;
    private boolean valid;
}
