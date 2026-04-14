package com.kofi.userservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private Long userId;
    private String accessToken;
    private String refreshToken;
    private String role;
}
