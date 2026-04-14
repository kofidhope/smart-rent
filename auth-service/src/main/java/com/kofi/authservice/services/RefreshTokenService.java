package com.kofi.authservice.services;

import com.kofi.authservice.model.RefreshToken;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RedisTemplate<String,Object> redisTemplate;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    private static final String PREFIX = "refresh_tokens:";

    public RefreshToken createRefreshToken(Long userId,String email,String role) {
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .userId(userId)
                .email(email)
                .role(role)
                .revoked(false)
                .expiration(refreshExpiration / 1000) // convert ms to seconds
                .build();

        redisTemplate.opsForValue().set(
                PREFIX + token,
                refreshToken,
                refreshExpiration,
                TimeUnit.MILLISECONDS
        );

        return refreshToken;
    }
    
    public RefreshToken findByToken(String token) {
        Object value = redisTemplate.opsForValue().get(PREFIX + token);
        if (value == null) {
            throw new RuntimeException("Refresh token not found or expired");
        }
        return (RefreshToken) value;
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
