package com.kofi.notification.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Nullable — not all notifications relate to a booking
    // e.g. account verification, password reset
    @Column(name = "booking_id")
    private UUID bookingId;

    // Who the notification is for
    // Used to query a tenant's notification history
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    // What triggered this notification
    // BOOKING_CONFIRMED, PAYMENT_RECEIVED etc.
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType type;

    // How it was sent — SMS or WHATSAPP
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationChannel channel;

    // Current delivery state
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    // Phone number used at send time
    // Stored here not fetched from user-service on retry
    // so retries use the same number as the original attempt
    @Column(name = "recipient_phone", length = 20)
    private String recipientPhone;

    // Email address — for future email channel support
    @Column(name = "recipient_email")
    private String recipientEmail;

    // Exact message text that was sent
    // Stored for audit — proves what information
    // the tenant was given at a specific point in time
    @Column(name = "message_body", nullable = false, columnDefinition = "TEXT")
    private String messageBody;

    // Twilio message SID — e.g. SM1234567890abcdef
    // Use this to look up delivery status in Twilio console
    // Populated after successful Twilio API call
    // Null if send failed before reaching Twilio
    @Column(name = "twilio_sid", length = 50)
    private String twilioSid;

    // Human-readable failure reason
    // Populated from Twilio error message or
    // from our own validation (e.g. "Phone number empty")
    @Column(name = "failure_reason")
    private String failureReason;

    // How many times we have attempted to send this
    // notification. Starts at 0, incremented on each
    // attempt. Retry job skips records where
    // retry_count >= 3
    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    // When the message was successfully handed to Twilio
    // Null if still PENDING or FAILED
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // -------------------------------------------------------
    // Convenience methods — called by NotificationService
    // to advance the log state without exposing
    // field mutation to callers
    // -------------------------------------------------------

    public void markSent(String sid) {
        this.twilioSid = sid;
        this.status = NotificationStatus.SENT;
        this.sentAt = LocalDateTime.now();
    }

    public void markFailed(String reason) {
        this.status = NotificationStatus.FAILED;
        this.failureReason = reason;
        this.retryCount = this.retryCount + 1;
    }

    public void markSkipped(String reason) {
        this.status = NotificationStatus.SKIPPED;
        this.failureReason = reason;
    }

    public void markDelivered() {
        this.status = NotificationStatus.DELIVERED;
    }

    public void markUndelivered(String reason) {
        this.status = NotificationStatus.UNDELIVERED;
        this.failureReason = reason;
    }

    public boolean isRetryEligible() {
        return this.status == NotificationStatus.FAILED
                && this.retryCount < 3;
    }
}
