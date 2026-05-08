package com.kofi.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@AllArgsConstructor
public class PaymentSucceededEvent {

    private UUID bookingId;

    private String paystackReference;

    private BigDecimal amount;

    private Long tenantId;

    private String tenantEmail;
}
