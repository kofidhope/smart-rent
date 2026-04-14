package com.kofi.authservice.services;

import com.kofi.authservice.dto.AuthResponse;
import com.kofi.authservice.dto.TokenValidationResponse;
import com.kofi.authservice.model.RefreshToken;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthResponse generateToken(Long userId, String email, String role) {

        String accessToken = jwtService.generateAccessToken(userId, email, role);

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                userId,
                email,
                role
        );

        return AuthResponse.builder()
                .userId(userId)
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .role(role)
                .build();
    }

    public AuthResponse refresh(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenStr);

        if (refreshToken.isRevoked()) {
            throw new RuntimeException("Refresh token has been revoked");
        }

        // Generate new access token
        String newAccessToken = jwtService.generateAccessToken(
                refreshToken.getUserId(),
                refreshToken.getEmail(),
                refreshToken.getRole()
        );

        // Rotate refresh token
        refreshTokenService.deleteToken(refreshTokenStr);
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(
                refreshToken.getUserId(),
                refreshToken.getEmail(),
                refreshToken.getRole()
        );

        return AuthResponse.builder()
                .userId(refreshToken.getUserId())
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .role(refreshToken.getRole())
                .build();
    }

    public void logout(String refreshTokenStr) {
        refreshTokenService.deleteToken(refreshTokenStr);
    }

    public TokenValidationResponse validateToken(String token) {
        if (!jwtService.isTokenValid(token)) {
            return TokenValidationResponse.builder()
                    .valid(false)
                    .build();
        }

        return TokenValidationResponse.builder()
                .valid(true)
                .userId(jwtService.extractUserId(token))
                .build();
    }
}
