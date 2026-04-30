package com.kofi.booking_service.service;

import com.kofi.booking_service.dto.BookingResponse;
import com.kofi.booking_service.dto.PropertyResponse;
import com.kofi.booking_service.model.Booking;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public BookingResponse toResponse(Booking booking,PropertyResponse property) {
        return BookingResponse.builder()
                .id(booking.getId())
                .tenantId(booking.getTenantId())
                .propertyId(booking.getPropertyId())
                .propertyTitle(property != null ? property.getTitle() : "N/A")
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .totalPrice(booking.getTotalPrice())
                .bookingStatus(booking.getBookingStatus())
                .paymentStatus(booking.getPaymentStatus())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
