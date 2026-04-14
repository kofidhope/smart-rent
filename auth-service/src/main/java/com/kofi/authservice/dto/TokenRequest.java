package com.kofi.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TokenRequest {
    private Long userId;
    private String email;
    private String role;
}
