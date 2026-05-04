package com.kofi.paymentservice.controller;

import com.kofi.paymentservice.model.Payment;
import com.kofi.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    // Tenant or owner checks payment status for a booking
    // Both can see the payment — access controlled in service
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<Payment> getPaymentByBooking(@PathVariable UUID bookingId,
            @RequestHeader("X-User-Id") Long requesterId) {

        return ResponseEntity.ok(paymentService.getPaymentByBookingId(bookingId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Payment>> getMyPayments(
            @RequestHeader("X-User-Id") UUID tenantId) {

        return ResponseEntity.ok(paymentService.getTenantPayments(tenantId));
    }

    @GetMapping("/owner/revenue")
    public ResponseEntity<List<Payment>> getOwnerRevenue(
            @RequestHeader("X-User-Id") UUID ownerId) {

        return ResponseEntity.ok(paymentService.getOwnerPayments(ownerId));
    }


    @GetMapping("/owner/revenue/total")
    public ResponseEntity<BigDecimal> getOwnerTotalRevenue(
            @RequestHeader("X-User-Id") UUID ownerId) {

        return ResponseEntity.ok(paymentService.getOwnerTotalRevenue(ownerId));
    }
}
