package com.kofi.authservice.controller;

import com.kofi.authservice.dto.*;
import com.kofi.authservice.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/token")
    public ResponseEntity<AuthResponse> generateToken(@Valid @RequestBody TokenRequest request) {
        AuthResponse response = authService.generateToken(
                request.getUserId(),
                request.getEmail(),
                request.getRole()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/validate")
    public ResponseEntity<TokenValidationResponse> validate(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(TokenValidationResponse.builder()
                    .valid(false).build());
        }

        String token = authHeader.substring(7);
        return ResponseEntity.ok(authService.validateToken(token));
    }
}
