package com.kofi.authservice.controller;

import com.kofi.authservice.dto.AuthResponse;
import com.kofi.authservice.dto.RefreshRequest;
import com.kofi.authservice.dto.TokenRequest;
import com.kofi.authservice.dto.TokenValidationResponse;
import com.kofi.authservice.services.AuthService;
import com.kofi.authservice.services.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    // -------------------------------------------------------
    // GENERATE TOKEN
    // Internal endpoint — called by user-service via Feign
    // Never called directly by the client
    // Returns AuthResponse with tokens so user-service
    // can extract them and set cookies
    // -------------------------------------------------------
    @PostMapping("/generate")
    public ResponseEntity<AuthResponse> generateToken(@Valid @RequestBody TokenRequest request) {
        AuthResponse response = authService.generateToken(
                request.getUserId(),
                request.getEmail(),
                request.getRole()
        );
        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------
    // REFRESH TOKEN
    // Called by frontend when access token expires
    // Reads refresh_token from httpOnly cookie
    // Sets new access_token and refresh_token cookies
    // Returns 200 with no body — cookies are the response
    // -------------------------------------------------------
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(@CookieValue(value = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null || refreshToken.isBlank()) {
            log.warn("Refresh attempted with no " + "refresh_token cookie");
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        try {
            AuthResponse authResponse = authService.refresh(refreshToken);
            // Set new access token cookie
            setAccessTokenCookie(response, authResponse.getAccessToken());
            // Set new refresh token cookie — rotation
            setRefreshTokenCookie(response, authResponse.getRefreshToken());
            log.info("Token refreshed successfully");
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            // Clear invalid cookies
            clearCookies(response);
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }
    }

    // -------------------------------------------------------
    // LOGOUT
    // Called by frontend when user clicks logout
    // Reads refresh_token cookie to revoke it in Redis
    // Clears both cookies
    // No service-to-service call needed — auth-service
    // owns the tokens and handles revocation directly
    // -------------------------------------------------------
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = "refresh_token", required = false)
            String refreshToken, HttpServletResponse response) {

        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                // Revoke token in Redis
                authService.logout(refreshToken);
                log.info("Refresh token revoked " + "on logout");
            } catch (Exception e) {
                // Token may already be expired
                // Logout should still succeed
                log.warn("Could not revoke token " + "on logout: {}", e.getMessage());
            }
        }
        // Always clear cookies regardless
        clearCookies(response);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------
    // VALIDATE TOKEN
    // Called by gateway or other services to verify a JWT
    // Returns token validity and extracted claims
    // -------------------------------------------------------
    @GetMapping("/validate")
    public ResponseEntity<TokenValidationResponse> validate(@RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(TokenValidationResponse.builder()
                            .valid(false)
                            .build());
        }
        String token = authHeader.substring(7);
        return ResponseEntity.ok(authService.validateToken(token));
    }

    // -------------------------------------------------------
    // Private cookie helpers
    // Centralised so every endpoint sets cookies
    // the exact same way — no inconsistency
    // -------------------------------------------------------

    private void setAccessTokenCookie(HttpServletResponse response, String token) {

        Cookie cookie = new Cookie("access_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);// Set to true when you have HTTPS in production
        cookie.setPath("/");
        cookie.setMaxAge(900);
        response.addCookie(cookie);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {

        Cookie cookie = new Cookie("refresh_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);// Set to true when you have HTTPS in production
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(604800);// 7 days in seconds
        response.addCookie(cookie);
    }

    private void clearCookies(HttpServletResponse response) {

        // Clear access token
        Cookie accessCookie = new Cookie("access_token", "");
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        response.addCookie(accessCookie);

        // Clear refresh token
        Cookie refreshCookie = new Cookie("refresh_token", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/api/auth/refresh");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);

        log.info("Cookies cleared");
    }
}