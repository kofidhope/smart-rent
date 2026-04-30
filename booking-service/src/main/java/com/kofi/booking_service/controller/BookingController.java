package com.kofi.booking_service.controller;

import com.kofi.booking_service.dto.BookingRequest;
import com.kofi.booking_service.dto.BookingResponse;
import com.kofi.booking_service.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Slf4j
public class BookingController {

    private final BookingService bookingService;

    // POST /api/bookings
    // Tenant creates a new booking
    // Saga starts immediately — response comes back as
    // PAYMENT_INITIATED not CONFIRMED
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request,
            @RequestHeader("X-User-Id") UUID tenantId) {
        BookingResponse response = bookingService.createBooking(request, tenantId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID requesterId) {
        return ResponseEntity.ok(bookingService.getBookingById(id, requesterId));
    }

    // Tenant fetches all their own bookings
    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@RequestHeader("X-User-Id") UUID tenantId) {

        return ResponseEntity.ok(
                bookingService.getMyBookings(tenantId));
    }

    // Property owner fetches all bookings for their property
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<BookingResponse>> getBookingsByProperty(@PathVariable UUID propertyId,
            @RequestHeader("X-User-Id") UUID requesterId) {
        return ResponseEntity.ok(bookingService.getBookingsByProperty(propertyId, requesterId));
    }

    // Tenant cancels a PENDING or PAYMENT_INITIATED booking
    // CONFIRMED bookings must go through refund flow instead
    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID requesterId) {

        return ResponseEntity.ok(bookingService.cancelBooking(id, requesterId));
    }

    // Internal endpoint — marks a booking as COMPLETED
    // Called by a scheduled job after checkout date passes
    // Not exposed through the API gateway to public users
    @PatchMapping("/{id}/complete")
    public ResponseEntity<Void> completeBooking(@PathVariable UUID id) {
        bookingService.completeBooking(id);
        return ResponseEntity.noContent().build();
    }
}
