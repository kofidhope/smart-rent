package com.kofi.notification.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingCompletedEvent {
    private UUID bookingId;
    private UUID tenantId;
    private UUID propertyId;
    private LocalDate endDate;
}
