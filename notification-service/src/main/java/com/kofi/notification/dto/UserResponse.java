package com.kofi.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

// Local copy of user-service's UserResponse
// Only the fields notification-service actually needs
// Phone is the primary field — used as SMS recipient
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private UUID id;

    private String firstName;

    private String lastName;

    private String email;

    private String phone;


    // Returns first name from email if firstName is blank
    // "kofi@example.com" → "Kofi"
    // Used in SMS greeting when name is unavailable
    public String getDisplayName() {
        if (firstName != null && !firstName.isBlank()) {
            return firstName;
        }
        if (email != null && email.contains("@")) {
            String namePart = email.split("@")[0];
            return namePart.substring(0, 1).toUpperCase()
                    + namePart.substring(1);
        }
        return "Valued Tenant";
    }

    // Returns true if phone number is present and valid
    // Notification-service skips SMS when this is false
    public boolean hasValidPhone() {
        return phone != null && !phone.isBlank() && phone.startsWith("+") && phone.length() >= 10;
    }

    // Full name for SMS body
    // Falls back gracefully if fields are missing
    public String getFullName() {
        if (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank()) {
            return firstName + " " + lastName;
        }
        return getDisplayName();
    }
}
