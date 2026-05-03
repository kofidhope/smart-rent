package com.kofi.paymentservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

// -------------------------------------------------------
// IMPORTANT: field names must match BookingConfirmedEvent
// in booking-service (com.smartrent.booking.event) exactly.
//
// This is a local copy — payment-service deserializes the
// Kafka message into this class. If a field name differs,
// Jackson silently sets it to null. No compile error.
// No runtime exception. Just missing data.
// -------------------------------------------------------
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingConfirmedEvent {

    // The booking this payment is for
    private UUID bookingId;

    // Who is paying
    private UUID tenantId;

    // Who receives the money (the property owner)
    private UUID ownerId;

    // Which property was booked
    private UUID propertyId;

    // How much to charge — in GHS, not pesewas
    // PaystackService multiplies by 100 before sending to Paystack
    private BigDecimal amount;

    // Tenant email — Paystack requires this to initialize a transaction
    // Also sent in PaymentSucceededEvent so notification-service
    // can SMS the tenant without calling user-service
    private String tenantEmail;

    // Property title — included in Paystack metadata
    // Shows on the tenant's payment receipt
    private String propertyTitle;
}
