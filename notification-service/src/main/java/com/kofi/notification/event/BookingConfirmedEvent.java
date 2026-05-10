package com.kofi.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

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
