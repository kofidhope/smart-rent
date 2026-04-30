package com.kofi.booking_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailedEvent {
    private UUID bookingId;
    private UUID tenantId;
    private String reason;
    private String paystackErrorCode;
}
