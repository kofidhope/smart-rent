package com.kofi.property_service.client;

import com.kofi.property_service.dto.UserResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UserServiceClientFallback implements UserServiceClient {

    @Override
    public UserResponse getUserById(UUID id) {
        UserResponse fallback = new UserResponse();
        fallback.setId(id);
        fallback.setFirstName("Unknown");
        fallback.setLastName("User");
        fallback.setEmail("");
        return fallback;
    }
}
