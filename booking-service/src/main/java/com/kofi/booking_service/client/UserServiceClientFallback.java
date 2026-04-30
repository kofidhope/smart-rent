package com.kofi.booking_service.client;

import com.kofi.booking_service.dto.UserResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class UserServiceClientFallback implements UserServiceClient {

    @Override
    public UserResponse getUserById(UUID id) {
        log.warn("Fallback: user-service unavailable. " +
                "Could not fetch user {}", id);

        UserResponse fallback = new UserResponse();
        fallback.setId(id);
        fallback.setFirstName("Unknown");
        fallback.setLastName("User");
        fallback.setEmail("");
        fallback.setPhone("");
        return fallback;
    }
}
