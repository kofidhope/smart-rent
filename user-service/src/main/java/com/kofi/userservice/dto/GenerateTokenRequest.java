package com.kofi.userservice.dto;

import lombok.Data;

@Data
public class GenerateTokenRequest {
    private Long userId;
    private String email;
    private String role;
}
