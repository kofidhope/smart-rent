package com.kofi.booking_service.event;

import com.kofi.booking_service.config.KafkaConfig;
import com.kofi.booking_service.saga.BookingSaga;
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
public class PaymentEventListener {

    private final BookingSaga bookingSaga;

    // Listens for successful payments from payment-service
    // Calls saga step 2A — transitions booking to CONFIRMED
    @KafkaListener(
            topics = KafkaConfig.PAYMENT_SUCCEEDED_TOPIC,
            groupId = "booking-service-group",
            containerFactory = "paymentSucceededListenerFactory"
    )
    public void onPaymentSucceeded(
            @Payload PaymentSucceededEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {

        log.info("Received PaymentSucceededEvent — " + "bookingId: {} paystackId: {} partition: {} offset: {}",
                event.getBookingId(),
                event.getPaystackPaymentIntentId(),
                partition,
                offset);

        try {
            bookingSaga.onPaymentSucceeded(event.getBookingId(), event.getPaystackPaymentIntentId());
            // Commit offset only after saga completes successfully
            // If saga throws, offset is not committed and Kafka
            // will redeliver the message on restart
            acknowledgment.acknowledge();

            log.info("PaymentSucceededEvent processed and acknowledged " + "bookingId: {}", event.getBookingId());

        } catch (Exception e) {
            log.error("Failed to process PaymentSucceededEvent " + "bookingId: {} error: {} " +
                            "offset NOT committed — will retry on restart",
                    event.getBookingId(), e.getMessage(), e);
        }
    }

    // Listens for failed payments from payment-service
    // Calls saga step 2B — transitions booking to CANCELLED
    @KafkaListener(
            topics = KafkaConfig.PAYMENT_FAILED_TOPIC,
            groupId = "booking-service-group",
            containerFactory = "paymentFailedListenerFactory"
    )
    public void onPaymentFailed(
            @Payload PaymentFailedEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {

        log.info("Received PaymentFailedEvent — " + "bookingId: {} reason: {} stripeCode: {} " +
                        "partition: {} offset: {}",
                event.getBookingId(),
                event.getReason(),
                event.getPaystackErrorCode(),
                partition,
                offset);

        try {
            bookingSaga.onPaymentFailed(event.getBookingId(), event.getReason());
            acknowledgment.acknowledge();
            log.info("PaymentFailedEvent processed and acknowledged — " + "bookingId: {}", event.getBookingId());
        } catch (Exception e) {
            log.error("Failed to process PaymentFailedEvent — " + "bookingId: {} error: {} " +
                            "offset NOT committed — will retry on restart",
                    event.getBookingId(), e.getMessage(), e);
        }
    }
}
