package com.kofi.userservice.controller;

import com.kofi.userservice.dto.ChangePasswordRequest;
import com.kofi.userservice.dto.UpdateUserRequest;
import com.kofi.userservice.dto.UserResponse;
import com.kofi.userservice.service.UserService;
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

    // ── Internal — no @PreAuthorize
    // Called by property-service, booking-service,
    // notification-service via Feign to fetch user details
    // permitAll in SecurityConfig handles this
    // No role header on Feign calls from Kafka listeners
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // ── Internal — fetch by email
    // Called by auth-service via Feign during login
    // to verify user exists before generating token
    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    // ── Tenant or Landlord — view own profile
    // Uses X-User-Id injected by gateway to fetch
    // the currently logged-in user's own profile
    @PreAuthorize("hasAnyRole('TENANT','LANDLORD')")
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getMyProfile(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PreAuthorize("hasAnyRole('TENANT','LANDLORD')")
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UpdateUserRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    @PreAuthorize("hasAnyRole('TENANT','LANDLORD')")
    @PutMapping("/profile/password")
    public ResponseEntity<Void> changePassword(
            @RequestBody ChangePasswordRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
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
    public ResponseEntity<Void> deleteUser(
            @PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}