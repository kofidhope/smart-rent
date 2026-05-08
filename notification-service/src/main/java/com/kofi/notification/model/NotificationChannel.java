package com.kofi.notification.model;

public enum NotificationChannel {

    // Standard SMS via Twilio
    // Works on any mobile number
    // 160 chars per segment, charged per segment
    SMS,

    // WhatsApp via Twilio WhatsApp API
    // Requires tenant to have WhatsApp installed
    // Up to 1600 chars, richer formatting
    // Free within 24hr conversation window
    WHATSAPP,

    // Future channels — not yet implemented
    EMAIL,
    PUSH
}
