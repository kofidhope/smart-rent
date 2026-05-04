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

        log.info("Received BookingConfirmedEvent — " + "bookingId: {} tenantId: {} amount: {} GHS " + "partition: {} offset: {} key: {}",
                event.getBookingId(),
                event.getTenantId(),
                event.getAmount(),
                partition,
                offset,
                key);

        try {
            // Delegate all business logic to PaymentService
            // This class only handles Kafka mechanics —
            // receive, delegate, acknowledge or not
            paymentService.processBookingPayment(event);

            // Commit offset — message successfully processed
            // Kafka will not redeliver this message to
            // this consumer group again
            acknowledgment.acknowledge();

            log.info("BookingConfirmedEvent acknowledged — " + "bookingId: {} partition: {} offset: {}",
                    event.getBookingId(),
                    partition,
                    offset);

        } catch (Exception e) {

            // Do NOT acknowledge
            // Kafka keeps the offset uncommitted
            // Message will be redelivered when service restarts
            // The DefaultErrorHandler in KafkaConfig retries
            // twice before calling the error callback
            log.error("Failed to process BookingConfirmedEvent — " +
                            "bookingId: {} partition: {} offset: {} " +
                            "error: {} " +
                            "offset NOT committed — will retry",
                    event.getBookingId(),
                    partition,
                    offset,
                    e.getMessage(),
                    e);
        }
    }
}
