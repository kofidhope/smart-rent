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
    private UUID bookingId;
    private UUID tenantId;
    private UUID ownerId;
    private UUID propertyId;
    private BigDecimal amount;
    private String tenantEmail;
    private String propertyTitle;
}
