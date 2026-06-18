package com.kofi.authservice.services;

import com.kofi.authservice.model.RefreshToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RedisTemplate<String,Object> redisTemplate;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    private static final String PREFIX = "refresh_tokens:";

    public RefreshToken createRefreshToken(UUID userId,String email,String role) {
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .userId(userId)
                .email(email)
                .role(role)
                .revoked(false)
                .expiration(refreshExpiration) 
                .build();

        redisTemplate.opsForValue().set(
                PREFIX + token,
                refreshToken,
                refreshExpiration,
                TimeUnit.MILLISECONDS
        );

        return refreshToken;
    }

    public RefreshToken validateAndRotate(String token) {

        Object value = redisTemplate.opsForValue().get(PREFIX + token);

        if (value == null) {
            throw new RuntimeException("Refresh token not found or expired. " + "Please login again.");
        }

        RefreshToken refreshToken = (RefreshToken) value;

        if (refreshToken.isRevoked()) {
            // Token was already used — possible theft
            // Delete everything for this user
            log.warn("Revoked token reuse detected " + "for userId: {}", refreshToken.getUserId());
            deleteAllForUser(refreshToken.getUserId());
            throw new RuntimeException("Security violation detected. " + "Please login again.");
        }

        // Delete old token immediately
        redisTemplate.delete(PREFIX + token);

        // Return the old token data so AuthService
        // can create a new one with same user info
        return refreshToken;
    }

    public RefreshToken findByToken(String token) {
        Object value = redisTemplate.opsForValue().get(PREFIX + token);
        if (value == null) {
            throw new RuntimeException("Refresh token not found or expired");
        }
        return (RefreshToken) value;
    }

    public void deleteAllForUser(UUID userId) {
        // Get all keys matching this user
        // Uses the @Indexed userId field
        String userIndexKey = "refresh_tokens:userId:"
                + userId;
        var tokenKeys = redisTemplate.opsForSet()
                .members(userIndexKey);

        if (tokenKeys != null) {
            tokenKeys.forEach(key ->
                    redisTemplate.delete(
                            PREFIX + key.toString()));
        }

        log.info("All refresh tokens deleted " +
                "for userId: {}", userId);
    }

    public void revokeToken(String token) {
        RefreshToken refreshToken = findByToken(token);
        refreshToken.setRevoked(true);
        redisTemplate.opsForValue().set(
                PREFIX + token,
                refreshToken,
                refreshExpiration,
                TimeUnit.MILLISECONDS
        );
    }

    public void deleteToken(String token) {
        redisTemplate.delete(PREFIX + token);
    }
}
