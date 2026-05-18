package com.kofi.paymentservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kofi.paymentservice.model.Payment;
import com.kofi.paymentservice.service.PaymentService;
import com.kofi.paymentservice.service.PaystackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    // ── Tenant or Landlord ────────────────────────────────
    // Both parties can check payment status
    // for a booking they are involved in
    @PreAuthorize("hasAnyRole('TENANT','LANDLORD')")
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<Payment> getPaymentByBooking(
            @PathVariable UUID bookingId,
            @RequestHeader("X-User-Id") UUID requesterId) {
        return ResponseEntity.ok(paymentService.getPaymentByBookingId(bookingId));
    }

    // ── Tenant only ───────────────────────────────────────
    // Personal payment history
    @PreAuthorize("hasRole('TENANT')")
    @GetMapping("/my")
    public ResponseEntity<List<Payment>> getMyPayments(
            @RequestHeader("X-User-Id") UUID tenantId) {
        return ResponseEntity.ok(paymentService.getTenantPayments(tenantId));
    }

    // ── Landlord only ─────────────────────────────────────
    // All payments received for their properties
    @PreAuthorize("hasRole('LANDLORD')")
    @GetMapping("/owner/revenue")
    public ResponseEntity<List<Payment>> getOwnerRevenue(
            @RequestHeader("X-User-Id") UUID ownerId) {
        return ResponseEntity.ok(paymentService.getOwnerPayments(ownerId));
    }

    // Total earnings in GHS
    @PreAuthorize("hasRole('LANDLORD')")
    @GetMapping("/owner/revenue/total")
    public ResponseEntity<BigDecimal> getOwnerTotalRevenue(
            @RequestHeader("X-User-Id") UUID ownerId) {
        return ResponseEntity.ok(paymentService.getOwnerTotalRevenue(ownerId));
    }
}