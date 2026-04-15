package com.kofi.userservice.config;

import com.kofi.userservice.dto.AuthResponse;
import com.kofi.userservice.dto.GenerateTokenRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "auth-service")
public interface AuthClient {
    @PostMapping("/auth/generate")
    AuthResponse generateToken(@RequestBody GenerateTokenRequest request);
}
