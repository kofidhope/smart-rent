package com.kofi.authservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TokenValidationResponse {
    private Long userId;
    private boolean valid;
}
