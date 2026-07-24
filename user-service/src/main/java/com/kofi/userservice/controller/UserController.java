package com.kofi.userservice.controller;

import com.kofi.userservice.dto.*;
import com.kofi.userservice.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegistrationRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {

        // userService.login() calls auth-service and
        // gets back AuthResponse with tokens
        AuthResponse authResponse = userService.login(request);

        // Set access token as httpOnly cookie
        Cookie accessCookie = new Cookie("access_token", authResponse.getAccessToken());
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(false); // true in prod
        accessCookie.setPath("/");
        accessCookie.setMaxAge(900); // 15 min
        response.addCookie(accessCookie);

        // Set refresh token as httpOnly cookie
        Cookie refreshCookie = new Cookie("refresh_token", authResponse.getRefreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(604800); // 7 days
        response.addCookie(refreshCookie);

        // Fetch and return user profile
        // Client gets name, email, role — no tokens
        UserResponse userResponse = userService.getUserById(authResponse.getUserId());
        return ResponseEntity.ok(userResponse);
    }

    // ── Internal — no @PreAuthorize
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // ── Internal — fetch by email
    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    // ── Tenant or Landlord — view own profile
    // Uses X-User-Id injected by gateway to fetch
    // the currently logged-in user's own profile
    @PreAuthorize("hasAnyRole('TENANT','LANDLORD')")
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getMyProfile(@RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PreAuthorize("hasAnyRole('TENANT','LANDLORD')")
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateUserRequest request, @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    @PreAuthorize("hasAnyRole('TENANT','LANDLORD')")
    @PutMapping("/profile/password")
    public ResponseEntity<Void> changePassword(@RequestBody ChangePasswordRequest request, @RequestHeader("X-User-Id") UUID userId) {
        userService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}