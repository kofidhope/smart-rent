package com.kofi.paymentservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

// -------------------------------------------------------
// IMPORTANT: field names must match PaymentFailedEvent
// in booking-service (com.smartrent.booking.event) exactly.
// -------------------------------------------------------
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailedEvent {

    // booking-service uses this to find and cancel the booking
    private UUID bookingId;

    // Who attempted to pay — notification-service uses this
    // to look up the tenant's phone number for SMS
    private UUID tenantId;

    // Human-readable failure reason
    // Stored in booking.failure_reason column
    // Shown to tenant in cancellation SMS
    private String reason;

    // Paystack machine-readable error code
    // e.g. "card_declined", "insufficient_funds", "INIT_FAILED"
    // Useful for support debugging without calling Paystack API
    private String paystackErrorCode;
}
