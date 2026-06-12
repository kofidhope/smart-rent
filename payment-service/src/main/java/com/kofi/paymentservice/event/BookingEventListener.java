package com.kofi.paymentservice.event;

import com.kofi.paymentservice.config.KafkaConfig;
import com.kofi.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingEventListener {

    private final PaymentService paymentService;

    // Listens on booking.confirmed topic
    // Published by booking-service when a tenant creates
    // a booking and the saga initiates payment
    // This is the entry point of the payment flow —
    // everything starts here
    @KafkaListener(
            topics = KafkaConfig.BOOKING_CONFIRMED_TOPIC,
            groupId = "payment-service-group",
            containerFactory = "bookingConfirmedListenerFactory"
    )
    public void onBookingConfirmed(
            @Payload BookingConfirmedEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            Acknowledgment acknowledgment) {

        log.info("=== EVENT RECEIVED ===");
        log.info("bookingId: {}", event.getBookingId());
        log.info("tenantId: {}", event.getTenantId());
        log.info("ownerId: {}", event.getOwnerId());
        log.info("amount: {}", event.getAmount());
        log.info("email: {}", event.getTenantEmail());
        log.info("propertyTitle: {}", event.getPropertyTitle());
        log.info("partition: {} offset: {}", partition, offset);
        log.info("=== END EVENT ===");

        try {
            paymentService.processBookingPayment(event);
            acknowledgment.acknowledge();
            log.info("BookingConfirmedEvent acknowledged — " +
                    "bookingId: {}", event.getBookingId());

        } catch (Exception e) {
            log.error("=== PROCESSING FAILED ===");
            log.error("Error type: {}",
                    e.getClass().getName());
            log.error("Error message: {}", e.getMessage());

            // Log full cause chain
            Throwable cause = e.getCause();
            int depth = 1;
            while (cause != null) {
                log.error("Cause {}: {} — {}",
                        depth,
                        cause.getClass().getName(),
                        cause.getMessage());
                cause = cause.getCause();
                depth++;
            }

            log.error("Full stack trace:", e);
            log.error("=== END FAILED ===");
        }
    }
}
