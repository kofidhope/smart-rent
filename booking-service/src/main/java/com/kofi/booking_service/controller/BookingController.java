package com.kofi.booking_service.controller;

import com.kofi.booking_service.dto.BookingRequest;
import com.kofi.booking_service.dto.BookingResponse;
import com.kofi.booking_service.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ── Tenant only
    @PreAuthorize("hasRole('TENANT')")
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request,
            @RequestHeader("X-User-Id") UUID tenantId) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bookingService.createBooking(request, tenantId));
    }

    @PreAuthorize("hasRole('TENANT')")
    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@RequestHeader("X-User-Id") UUID tenantId) {
        return ResponseEntity.ok(bookingService.getMyBookings(tenantId));
    }

    @PreAuthorize("hasRole('TENANT')")
    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID requesterId) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, requesterId));
    }

    // ── Tenant or Landlord ────────────────────────────────
    // Both can view a single booking
    // Service layer checks ownership
    @PreAuthorize("hasAnyRole('TENANT','LANDLORD')")
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID requesterId) {
        return ResponseEntity.ok(bookingService.getBookingById(id, requesterId));
    }

    // ── Landlord only ─────────────────────────────────────
    // See all bookings for a specific property they own
    @PreAuthorize("hasRole('LANDLORD')")
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<BookingResponse>> getBookingsByProperty(@PathVariable UUID propertyId,
            @RequestHeader("X-User-Id") UUID requesterId) {
        return ResponseEntity.ok(bookingService.getBookingsByProperty(propertyId, requesterId));
    }

    // ── Internal — scheduled job calls this ───────────────
    // No @PreAuthorize — permitAll in SecurityConfig
    // Called nightly to mark past bookings as COMPLETED
    // No user context — scheduler has no JWT
    @PatchMapping("/{id}/complete")
    public ResponseEntity<Void> completeBooking(@PathVariable UUID id) {
        bookingService.completeBooking(id);
        return ResponseEntity.noContent().build();
    }
}