package com.kofi.notification.model;

public enum NotificationStatus {

    // Log record created, not yet sent to Twilio
    PENDING,

    // Twilio API accepted the message and returned a SID
    // Does not mean the tenant received it —
    // just means Twilio queued it for delivery
    SENT,

    // Twilio confirmed delivery to
    // Carrier confirmed delivery to handset
    // Best outcome — tenant definitely got the message
    DELIVERED,

    // Twilio API call failed — network error,
    // invalid credentials, or Twilio outage
    // retry_count < 3 → eligible for retry
    FAILED,

    // Twilio accepted but carrier could not deliver
    // Wrong number, phone off for too long, number blocked
    // Not retryable — same attempt will fail again
    UNDELIVERED,

    // Phone number was empty or missing
    // user-service fallback returned no phone
    // Cannot send — logged for awareness
    SKIPPED
}
