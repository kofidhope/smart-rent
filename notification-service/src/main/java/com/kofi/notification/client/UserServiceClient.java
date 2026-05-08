package com.kofi.notification.client;

import com.kofi.notification.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "user-service",
        fallback = UserServiceClientFallback.class
)
public interface UserServiceClient {

    // -------------------------------------------------------
    // Fetch tenant details by ID
    // Called before every SMS send to get
    // Phone number is not carried in Kafka events —
    // fetched at send time to protect personal data
    // -------------------------------------------------------
    @GetMapping("/api/users/{id}")
    UserResponse getUserById(@PathVariable UUID id);

    // -------------------------------------------------------
    // Fetch owner details by ID
    // Called when PaymentSucceededEvent arrives to
    // notify the property owner of a new confirmed booking
    // Owner ID is in the event — phone fetched here
    // -------------------------------------------------------
    @GetMapping("/api/users/{id}")
    default UserResponse getOwnerById(@PathVariable UUID id) {
        return getUserById(id);
    }
}
