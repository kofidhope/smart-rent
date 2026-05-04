package com.kofi.paymentservice.event;

import com.kofi.paymentservice.config.KafkaConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    // PUBLISH PAYMENT SUCCEEDED
    // Called by PaymentService after Paystack webhook
    // confirms charge.success and verification passes
    // Consumers:
    //   booking-service  → confirms booking, marks CONFIRMED
    //   notification-service → SMS "Your booking is confirmed"
    public void publishPaymentSucceeded(
            UUID bookingId,
            String paystackReference,
            BigDecimal amount,
            UUID tenantId,
            String tenantEmail) {

        PaymentSucceededEvent event = PaymentSucceededEvent.builder()
                .bookingId(bookingId)
                .paystackReference(paystackReference)
                .amount(amount)
                .tenantId(tenantId)
                .tenantEmail(tenantEmail)
                .build();

        send(
                KafkaConfig.PAYMENT_SUCCEEDED_TOPIC,
                bookingId.toString(),
                event,
                "PaymentSucceededEvent"
        );
    }

    // PUBLISH PAYMENT FAILED
    // Called by PaymentService when:
    //   - Paystack webhook reports charge.failed
    //   - Paystack initialization fails (API error)
    //   - Verification contradicts the webhook
    // Consumers:
    //   booking-service  → cancels booking, marks CANCELLED
    //   notification-service → SMS "Your payment failed"
    public void publishPaymentFailed(
            UUID bookingId,
            UUID tenantId,
            String reason,
            String paystackErrorCode) {

        PaymentFailedEvent event = PaymentFailedEvent.builder()
                .bookingId(bookingId)
                .tenantId(tenantId)
                .reason(reason)
                .paystackErrorCode(paystackErrorCode)
                .build();

        send(
                KafkaConfig.PAYMENT_FAILED_TOPIC,
                bookingId.toString(),
                event,
                "PaymentFailedEvent"
        );
    }

    // Private send method
    // All publish calls go through here
    // Handles success callback, failure callback,
    // and logging in one place so publish methods
    // stay clean and focused on building the event
    private void send(String topic,
                      String key,
                      Object event,
                      String eventName) {

        log.info("Publishing {} — topic: {} key: {}", eventName, topic, key);

        CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, key, event);

        future.whenComplete((result, ex) -> {

            if (ex != null) {
                // Kafka failed to send after all retries
                // This is serious — downstream services will
                // not receive this event without manual intervention
                log.error(
                        "FAILED to publish {} — topic: {} key: {} " +
                                "error: {} " +
                                "ACTION REQUIRED: manually republish or " +
                                "trigger saga compensation",
                        eventName, topic, key,
                        ex.getMessage()
                );
                // In production: write to an outbox table or
                // alert via PagerDuty / Slack webhook
                return;
            }

            // Log exactly where the message landed in Kafka
            // partition + offset = precise location for debugging
            log.info(
                    "Published {} — topic: {} partition: {} offset: {}",
                    eventName,
                    result.getRecordMetadata().topic(),
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset()
            );
        });
    }
}
