package com.kofi.notification.service;

import com.kofi.notification.client.UserServiceClient;
import com.kofi.notification.dto.UserResponse;
import com.kofi.notification.event.BookingCancelledEvent;
import com.kofi.notification.event.BookingConfirmedEvent;
import com.kofi.notification.event.PaymentFailedEvent;
import com.kofi.notification.event.PaymentSucceededEvent;
import com.kofi.notification.model.NotificationChannel;
import com.kofi.notification.model.NotificationLog;
import com.kofi.notification.model.NotificationStatus;
import com.kofi.notification.model.NotificationType;
import com.kofi.notification.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationLogRepository logRepository;
    private final TwilioService twilioService;
    private final UserServiceClient userServiceClient;

    // BOOKING INITIATED
    // Triggered by BookingConfirmedEvent from Kafka
    // Sent when booking saga initiates payment
    // Tells tenant to complete their payment
    @Transactional
    public void notifyBookingInitiated(BookingConfirmedEvent event) {

        log.info("Processing BOOKING_INITIATED notification — " + "bookingId: {} tenantId: {}", event.getBookingId(), event.getTenantId());

        // Idempotency check
        if (alreadySent(event.getBookingId(), NotificationType.BOOKING_INITIATED)) {
            return;
        }

        // Fetch tenant phone
        UserResponse tenant = userServiceClient.getUserById(event.getTenantId());

        // Build message
        String message = buildBookingInitiatedMessage(
                tenant.getDisplayName(),
                event.getPropertyTitle(),
                event.getAmount().toPlainString()
        );

        // Send and log
        sendAndLog(
                event.getBookingId(),
                event.getTenantId(),
                NotificationType.BOOKING_INITIATED,
                tenant,
                message
        );
    }

    // BOOKING CONFIRMED + PAYMENT RECEIVED
    // Triggered by PaymentSucceededEvent from Kafka
    // Sends TWO notifications:
    //   1. Tenant — booking confirmed, payment received
    //   2. Owner  — new booking on their property
    @Transactional
    public void notifyPaymentSucceeded(PaymentSucceededEvent event) {

        log.info("Processing BOOKING_CONFIRMED notification — " + "bookingId: {} tenantId: {}", event.getBookingId(), event.getTenantId());

        // Notify tenant
        if (!alreadySent(event.getBookingId(), NotificationType.BOOKING_CONFIRMED)) {

            UserResponse tenant = userServiceClient.getUserById(event.getTenantId());

            String tenantMessage = buildPaymentSucceededMessage(
                    tenant.getDisplayName(),
                    event.getAmount().toPlainString(),
                    event.getPaystackReference()
            );

            sendAndLog(
                    event.getBookingId(),
                    event.getTenantId(),
                    NotificationType.BOOKING_CONFIRMED,
                    tenant,
                    tenantMessage
            );
        }

        // Notify owner
        // PaymentSucceededEvent does not carry ownerId
        // Owner notification is best-effort here
        // Full owner notification requires booking details
        // fetched from booking-service — future enhancement
        // For now log that owner notification is pending
        log.info("Owner notification for bookingId: {} " +
                        "requires ownerId from booking-service — " +
                        "skipped in current implementation. " +
                        "Add owner fetch via Feign when ready.",
                event.getBookingId());
    }

    // BOOKING CANCELLED
    // Triggered by BookingCancelledEvent from Kafka
    // Sent when booking saga cancels due to payment failure
    // or tenant manually cancels
    @Transactional
    public void notifyBookingCancelled(BookingCancelledEvent event) {

        log.info("Processing BOOKING_CANCELLED notification — " + "bookingId: {} tenantId: {} reason: {}", event.getBookingId(), event.getTenantId(), event.getReason());

        // ── Idempotency check ────────────────────────────────
        if (alreadySent(event.getBookingId(), NotificationType.BOOKING_CANCELLED)) {
            return;
        }

        //Fetch tenant phone
        UserResponse tenant = userServiceClient.getUserById(event.getTenantId());

        // Build message
        String message = buildBookingCancelledMessage(
                tenant.getDisplayName(),
                event.getReason()
        );

        // Send and log
        sendAndLog(
                event.getBookingId(),
                event.getTenantId(),
                NotificationType.BOOKING_CANCELLED,
                tenant,
                message
        );
    }

    // PAYMENT FAILED
    // Triggered by PaymentFailedEvent from Kafka
    // Sent when Paystack charge fails
    // Tells tenant what went wrong and what to do next
    @Transactional
    public void notifyPaymentFailed(PaymentFailedEvent event) {

        log.info("Processing BOOKING_CANCELLED " + "(payment failed) notification — " + "bookingId: {} tenantId: {} reason: {}",
                event.getBookingId(),
                event.getTenantId(),
                event.getReason());

        // Payment failure and manual cancellation both
        // result in BOOKING_CANCELLED notification type
        // The message content differs but the type is same
        if (alreadySent(event.getBookingId(), NotificationType.BOOKING_CANCELLED)) {
            return;
        }

        // Fetch tenant phone
        UserResponse tenant = userServiceClient.getUserById(event.getTenantId());

        // Build message
        String message = buildPaymentFailedMessage(
                tenant.getDisplayName(),
                event.getReason()
        );

        // Send and log
        sendAndLog(
                event.getBookingId(),
                event.getTenantId(),
                NotificationType.BOOKING_CANCELLED,
                tenant,
                message
        );
    }

    // SEND AND LOG — core private method
    // All four notification methods flow through here
    // Handles: skip check, log creation, Twilio call,
    //          log update on success or failure
    private void sendAndLog(UUID bookingId,
                            UUID tenantId,
                            NotificationType type,
                            UserResponse recipient,
                            String messageBody) {

        // Skip if no valid phone
        if (!recipient.hasValidPhone()) {
            log.warn("Skipping SMS — no valid phone for " +
                            "tenantId: {} bookingId: {} type: {}",
                    tenantId, bookingId, type);

            NotificationLog skippedLog = NotificationLog
                    .builder()
                    .bookingId(bookingId)
                    .tenantId(tenantId)
                    .type(type)
                    .channel(NotificationChannel.SMS)
                    .status(NotificationStatus.SKIPPED)
                    .recipientPhone("")
                    .messageBody(messageBody)
                    .build();

            skippedLog.markSkipped(
                    "Phone number empty — " +
                            "user-service unavailable or " +
                            "tenant has no phone registered");

            logRepository.save(skippedLog);
            return;
        }

        // ── Create PENDING log record ────────────────────────
        // Written BEFORE calling Twilio so if the service
        // crashes between here and the Twilio call,
        // the stuck pending job picks it up and retries
        NotificationLog notificationLog = NotificationLog
                .builder()
                .bookingId(bookingId)
                .tenantId(tenantId)
                .type(type)
                .channel(NotificationChannel.SMS)
                .status(NotificationStatus.PENDING)
                .recipientPhone(recipient.getPhone())
                .recipientEmail(recipient.getEmail())
                .messageBody(messageBody)
                .build();

        NotificationLog saved = logRepository
                .save(notificationLog);

        log.info("Notification log created — id: {} " +
                        "type: {} status: PENDING",
                saved.getId(), type);

        // ── Call Twilio ──────────────────────────────────────
        try {
            String twilioSid = twilioService.sendSms(
                    recipient.getPhone(),
                    messageBody
            );

            // Advance log to SENT with Twilio SID
            saved.markSent(twilioSid);
            logRepository.save(saved);

            log.info("Notification SENT — id: {} " +
                            "type: {} sid: {} to: {}",
                    saved.getId(), type, twilioSid,
                    maskPhone(recipient.getPhone()));

        } catch (Exception e) {

            // Advance log to FAILED with reason
            saved.markFailed(e.getMessage());
            logRepository.save(saved);

            log.error("Notification FAILED — id: {} " +
                            "type: {} to: {} error: {}",
                    saved.getId(), type,
                    maskPhone(recipient.getPhone()),
                    e.getMessage());

            // Do NOT rethrow — a failed SMS should not
            // cause the Kafka listener to fail and
            // redeliver the event. The notification log
            // records the failure for retry by the
            // scheduled job. The booking and payment
            // flows are unaffected by SMS failure.
        }
    }

    // SMS message templates
    // Each method builds the exact text sent to the tenant
    // Keep under 160 chars for single-segment SMS
    private String buildBookingInitiatedMessage(String name, String propertyTitle, String amount) {

        return String.format(
                "Hi %s, your booking for %s is being processed. " +
                        "Complete payment of GHS %s to confirm. " +
                        "- SmartRent",
                name, propertyTitle, amount
        );
    }

    private String buildPaymentSucceededMessage(String name, String amount, String reference) {
        return String.format(
                "Hi %s, your booking is CONFIRMED! " +
                        "Payment of GHS %s received. " +
                        "Ref: %s. Welcome home! - SmartRent",
                name, amount, reference
        );
    }

    private String buildBookingCancelledMessage(String name, String reason) {
        return String.format(
                "Hi %s, your booking has been cancelled. " +
                        "Reason: %s. " +
                        "Visit SmartRent to book again. - SmartRent",
                name, reason
        );
    }

    private String buildPaymentFailedMessage(String name, String reason) {
        return String.format(
                "Hi %s, your payment could not be processed. " +
                        "Reason: %s. " +
                        "Please try again or contact support. - SmartRent",
                name, reason
        );
    }

    // Private helpers
    private boolean alreadySent(UUID bookingId, NotificationType type) {
        boolean exists = logRepository.existsByBookingIdAndType(bookingId, type);
        if (exists) {
            log.warn("Duplicate notification detected — " + "bookingId: {} type: {} — skipping", bookingId, type);
        }
        return exists;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 6) {
            return "***";
        }
        return phone.substring(0, 4) + "*****" + phone.substring(phone.length() - 3);
    }
}