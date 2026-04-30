package com.kofi.booking_service.saga;

import com.kofi.booking_service.client.PropertyServiceClient;
import com.kofi.booking_service.config.KafkaConfig;
import com.kofi.booking_service.event.BookingCancelledEvent;
import com.kofi.booking_service.event.BookingConfirmedEvent;
import com.kofi.booking_service.model.Booking;
import com.kofi.booking_service.model.BookingStatus;
import com.kofi.booking_service.model.PaymentStatus;
import com.kofi.booking_service.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingSaga {

    private final BookingRepository bookingRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final PropertyServiceClient propertyServiceClient;

    // STEP 1 — always called first
    // Triggered by: BookingService.createBooking()
    // Transitions: PENDING → PAYMENT_INITIATED
    // Publishes:   BookingConfirmedEvent to Kafka
    @Transactional
    public void initiatePayment(Booking booking, String tenantEmail, String propertyTitle) {

        log.info("initiating payment for booking {} " + "amount {} tenant {}",
                booking.getId(), booking.getTotalPrice(), booking.getTenantId());

        // Guard — only advance if booking is in PENDING state
        // Protects against duplicate calls
        if (booking.getBookingStatus() != BookingStatus.PENDING) {
            log.warn("booking {} is already in status {}", booking.getId(), booking.getBookingStatus());
            return;
        }

        // Advance state
        booking.setBookingStatus(BookingStatus.PAYMENT_INITIATED);
        booking.setPaymentStatus(PaymentStatus.PROCESSING);
        bookingRepository.save(booking);

        // Build the event that payment-service will consume
        BookingConfirmedEvent event = BookingConfirmedEvent.builder()
                .bookingId(booking.getId())
                .tenantId(booking.getTenantId())
                .ownerId(booking.getOwnerId())
                .propertyId(booking.getPropertyId())
                .amount(booking.getTotalPrice())
                .tenantEmail(tenantEmail)
                .propertyTitle(propertyTitle)
                .build();

        // Publish — bookingId is the Kafka message key
        // so all events for this booking go to the same partition
        // and arrive in order
        kafkaTemplate.send(
                KafkaConfig.BOOKING_CONFIRMED_TOPIC,
                booking.getId().toString(),
                event
        );

        log.info("BookingConfirmedEvent published " + "for booking {}", booking.getId());
    }

    // STEP 2A — happy path
    // Triggered by: PaymentEventListener.onPaymentSucceeded()
    // Transitions: PAYMENT_INITIATED → CONFIRMED
    // Side effect: marks property as RENTED in property-service
    @Transactional
    public void onPaymentSucceeded(UUID bookingId, String paystackPaymentIntentId) {
        Booking booking = findOrThrow(bookingId);
        // Guard — idempotency check
        // If this event is replayed by Kafka, don't process twice
        if (booking.getBookingStatus() == BookingStatus.CONFIRMED) {
            log.warn("booking {} already CONFIRMED", bookingId);
            return;
        }
        // Guard — only advance from the correct prior state
        if (booking.getBookingStatus() != BookingStatus.PAYMENT_INITIATED) {
            log.error("unexpected state. " + "Booking {} is in status {} expected PAYMENT_INITIATED",
                    bookingId, booking.getBookingStatus());
            return;
        }

        // Advance state — store stripe ID for future refunds
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        booking.setPaymentStatus(PaymentStatus.PAID);
        booking.setPaystackPaymentId(paystackPaymentIntentId);
        bookingRepository.save(booking);

        log.info("booking {} saved as CONFIRMED", bookingId);

        // Compensating forward action — mark property as rented
        // This call has its own fallback in PropertyServiceClientFallback
        // If it fails, the error is logged at CRITICAL level for
        // manual intervention — the booking is still confirmed
        try {
            propertyServiceClient.markAsRented(booking.getPropertyId());
            log.info("property {} marked as RENTED", booking.getPropertyId());
        } catch (Exception e) {
            log.error("CRITICAL: failed to mark property {} " + "as rented after confirming booking {}. " +
                            "Manual fix required. Error: {}",
                    booking.getPropertyId(), bookingId, e.getMessage());
        }
        log.info("booking {} fully CONFIRMED", bookingId);
    }

    // STEP 2B — failure path
    // Triggered by: PaymentEventListener.onPaymentFailed()
    // Transitions: PAYMENT_INITIATED → CANCELLED
    // Side effect: publishes BookingCancelledEvent so
    // notification-service can SMS the tenant
    @Transactional
    public void onPaymentFailed(UUID bookingId, String reason) {
        log.info("payment failed for booking {} reason: {}", bookingId, reason);
        Booking booking = findOrThrow(bookingId);
        // Guard — idempotency check
        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            log.warn("booking {} already CANCELLED", bookingId);
            return;
        }
        // Guard — only cancel from valid prior states
        if (booking.getBookingStatus() != BookingStatus.PAYMENT_INITIATED
                && booking.getBookingStatus() != BookingStatus.PENDING) {
            log.error("unexpected state. " + "Booking {} is in status {} " + "expected PAYMENT_INITIATED or PENDING",
                    bookingId, booking.getBookingStatus());
            return;
        }
        // Advance state — store failure reason for support queries
        booking.setBookingStatus(BookingStatus.CANCELLED);
        booking.setPaymentStatus(PaymentStatus.FAILED);
        booking.setFailureReason(reason);
        bookingRepository.save(booking);

        log.info("booking {} saved as CANCELLED", bookingId);
        // Property stays AVAILABLE — no compensating action needed
        // because we never marked it as RENTED in step 1.
        // This is intentional saga design — irreversible actions
        // happen as late as possible (only in step 2A).
        // Notify tenant via notification-service
        BookingCancelledEvent event = BookingCancelledEvent.builder()
                .bookingId(bookingId)
                .tenantId(booking.getTenantId())
                .propertyId(booking.getPropertyId())
                .reason(reason)
                .build();

        kafkaTemplate.send(
                KafkaConfig.BOOKING_CANCELLED_TOPIC,
                bookingId.toString(),
                event
        );

        log.info("booking {} CANCELLED, " + "BookingCancelledEvent published", bookingId);
    }

    // Private helpers
    private Booking findOrThrow(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> {
                    log.error("booking {} not found in database", bookingId);
                    return new RuntimeException("Booking not found in saga: " + bookingId);
                });
    }
}
