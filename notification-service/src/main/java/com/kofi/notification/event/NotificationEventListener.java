package com.kofi.notification.event;

import com.kofi.notification.config.KafkaConfig;
import com.kofi.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;

    @KafkaListener(
            topics = KafkaConfig.BOOKING_CONFIRMED_TOPIC,
            groupId = "notification-service-group",
            containerFactory = "bookingConfirmedListenerFactory"
    )
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        log.info("Notification listener received BookingConfirmedEvent: {}", event.getBookingId());
        notificationService.notifyBookingInitiated(event);
    }

    @KafkaListener(
            topics = KafkaConfig.BOOKING_CANCELLED_TOPIC,
            groupId = "notification-service-group",
            containerFactory = "bookingCancelledListenerFactory"
    )
    public void onBookingCancelled(BookingCancelledEvent event) {
        log.info("Notification listener received BookingCancelledEvent: {}", event.getBookingId());
        notificationService.notifyBookingCancelled(event);
    }

    @KafkaListener(
            topics = KafkaConfig.PAYMENT_SUCCEEDED_TOPIC,
            groupId = "notification-service-group",
            containerFactory = "paymentSucceededListenerFactory"
    )
    public void onPaymentSucceeded(PaymentSucceededEvent event) {
        log.info("Notification listener received PaymentSucceededEvent: {}", event.getBookingId());
        notificationService.notifyPaymentSucceeded(event);
    }

    @KafkaListener(
            topics = KafkaConfig.PAYMENT_FAILED_TOPIC,
            groupId = "notification-service-group",
            containerFactory = "paymentFailedListenerFactory"
    )
    public void onPaymentFailed(PaymentFailedEvent event) {
        log.info("Notification listener received PaymentFailedEvent: {}", event.getBookingId());
        notificationService.notifyPaymentFailed(event);
    }
}
