package com.kofi.paymentservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

// -------------------------------------------------------
// IMPORTANT: field names must match PaymentSucceededEvent
// in booking-service (com.smartrent.booking.event) exactly.
//
// booking-service deserializes this into its own copy of
// this class. Field name mismatch = silent null. No error.
// -------------------------------------------------------
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSucceededEvent {

    // Links back to the booking that triggered this payment
    // booking-service uses this to find and confirm the booking
    private UUID bookingId;

    // Paystack's unique reference for this transaction
    // booking-service stores this in the stripe_payment_id column
    // (column name is legacy — holds the Paystack reference now)
    // Used later for refunds
    private String paystackReference;

    // Actual amount charged — in GHS
    // booking-service can verify this matches what was requested
    private BigDecimal amount;

    // Who was charged
    private UUID tenantId;

    // Tenant email — carried forward so notification-service
    // can send SMS confirmation without calling user-service
    private String tenantEmail;
}
