package com.kofi.notification.client;

import com.kofi.notification.dto.UserResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class UserServiceClientFallback implements UserServiceClient {

    // -------------------------------------------------------
    // Fallback when user-service is unavailable
    //
    // Returns a UserResponse with empty phone number.
    // NotificationService checks for empty phone and
    // marks the notification as SKIPPED rather than
    // crashing or retrying endlessly.
    //
    // This is graceful degradation — the booking and
    // payment flows are unaffected. Only the SMS is
    // skipped. The notification log records the skip
    // with reason "user-service unavailable" so the
    // operations team can manually notify if needed.
    // -------------------------------------------------------
    @Override
    public UserResponse getUserById(UUID id) {
        log.warn("Fallback: user-service unavailable — " + "could not fetch phone for userId: {}. " +
                        "SMS will be skipped for this notification.", id);

        return UserResponse.builder()
                .id(id)
                .firstName("Unknown")
                .lastName("User")
                .email("")
                .phone("")
                .build();
    }
}
