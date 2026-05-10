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
public class PaymentSucceededEvent {

    private UUID bookingId;

    private String paystackReference;

    private BigDecimal amount;

    private UUID tenantId;

    private String tenantEmail;
}
