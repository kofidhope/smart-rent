package com.kofi.authservice.services;

import com.kofi.authservice.dto.AuthResponse;
import com.kofi.authservice.dto.TokenValidationResponse;
import com.kofi.authservice.model.RefreshToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final RedisTemplate<String,Object> redisTemplate;

    private static final String PREFIX = "refresh_tokens:";

    public AuthResponse generateToken(UUID userId, String email, String role) {

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
        // Step 1: Look up token
        Object value = redisTemplate.opsForValue().get(PREFIX + refreshTokenStr);
        if (value == null) {
            throw new RuntimeException("Refresh token not found or expired. Please login again.");
        }

        RefreshToken refreshToken = (RefreshToken) value;

        // Step 2: Check if revoked
        if (refreshToken.isRevoked()) {
            // Security violation: revoked token reuse
            log.warn("Revoked token reuse detected for userId: {}", refreshToken.getUserId());
            refreshTokenService.deleteAllForUser(refreshToken.getUserId());
            throw new RuntimeException("Security violation detected. Please login again.");
        }

        // Step 3: Generate new access token
        String newAccessToken = jwtService.generateAccessToken(
                refreshToken.getUserId(),
                refreshToken.getEmail(),
                refreshToken.getRole()
        );

        // Step 4: Revoke and delete old token
        refreshTokenService.revokeToken(refreshTokenStr);
        refreshTokenService.deleteToken(refreshTokenStr);

        // Step 5: Create new refresh token
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(
                refreshToken.getUserId(),
                refreshToken.getEmail(),
                refreshToken.getRole()
        );

        // Step 6: Return response
        return AuthResponse.builder()
                .userId(refreshToken.getUserId())
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .role(refreshToken.getRole())
                .build();
    }

    public void logout(String refreshTokenStr) {
        // revoke before delete for audit safety
        refreshTokenService.revokeToken(refreshTokenStr);
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
