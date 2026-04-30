package com.kofi.booking_service.dto;

import com.kofi.booking_service.model.BookingStatus;
import com.kofi.booking_service.model.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BookingResponse {
    private UUID id;
    private UUID tenantId;
    private UUID propertyId;
    private String propertyTitle;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalPrice;
    private BookingStatus bookingStatus;
    private PaymentStatus paymentStatus;
    private LocalDateTime createdAt;
}
