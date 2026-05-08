package com.kofi.notification.repository;

import com.kofi.notification.model.NotificationLog;
import com.kofi.notification.model.NotificationStatus;
import com.kofi.notification.model.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {

    // -------------------------------------------------------
    // Find all notifications for a booking
    // Used by support team to see full notification
    // history for a specific booking
    // e.g. "Did the tenant get their confirmation SMS?"
    // -------------------------------------------------------
    List<NotificationLog> findByBookingIdOrderByCreatedAtDesc(UUID bookingId);

    // -------------------------------------------------------
    // Find all notifications for a tenant
    // Used for tenant notification history screen
    // Shows every SMS they received from SmartRent
    // -------------------------------------------------------
    List<NotificationLog> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    // -------------------------------------------------------
    // Find notifications by type for a booking
    // Used to check if a specific notification was
    // already sent for a booking — idempotency guard
    // e.g. "Was BOOKING_CONFIRMED already sent for #abc?"
    // -------------------------------------------------------
    Optional<NotificationLog> findByBookingIdAndType(UUID bookingId, NotificationType type);

    // -------------------------------------------------------
    // Check if a notification type was already sent
    // Faster than findByBookingIdAndType when you only
    // need yes/no — generates SELECT COUNT(*) > 0
    // Primary idempotency check before sending any SMS
    // -------------------------------------------------------
    boolean existsByBookingIdAndType(UUID bookingId, NotificationType type);

    // -------------------------------------------------------
    // Find by Twilio SID
    // Used when Twilio webhook delivers a status callback
    // to update delivery status from SENT to DELIVERED
    // or UNDELIVERED
    // -------------------------------------------------------
    Optional<NotificationLog> findByTwilioSid(String twilioSid);

    // -------------------------------------------------------
    // Find failed notifications eligible for retry
    // Called by scheduled retry job every 15 minutes
    // Only returns records where retry_count < 3
    // and failure was not due to invalid phone number
    // -------------------------------------------------------
    @Query("""
        SELECT n FROM NotificationLog n
        WHERE n.status = 'FAILED'
        AND n.retryCount < 3
        AND n.createdAt > :cutoff
        AND n.failureReason NOT LIKE '%invalid%'
        AND n.failureReason NOT LIKE '%unsubscribed%'
        ORDER BY n.createdAt ASC
        """)
    List<NotificationLog> findRetryEligible(@Param("cutoff") LocalDateTime cutoff);

    // -------------------------------------------------------
    // Find all SKIPPED notifications for a tenant
    // SKIPPED means phone number was empty when we tried
    // to send. Support team can use this to manually
    // contact the tenant through other means
    // -------------------------------------------------------
    List<NotificationLog> findByTenantIdAndStatus(UUID tenantId, NotificationStatus status);

    // -------------------------------------------------------
    // Count notifications by status
    // Used for operations dashboard
    // e.g. how many SMS failed today
    // -------------------------------------------------------
    long countByStatusAndCreatedAtAfter(NotificationStatus status, LocalDateTime after);

    // -------------------------------------------------------
    // Count by type and status for analytics
    // e.g. "How many BOOKING_CONFIRMED SMS were delivered
    //       successfully in the last 7 days?"
    // -------------------------------------------------------
    long countByTypeAndStatusAndCreatedAtAfter(NotificationType type, NotificationStatus status, LocalDateTime after);

    // -------------------------------------------------------
    // Find PENDING notifications older than 5 minutes
    // PENDING means the log was created but the Twilio
    // call never completed — service may have crashed
    // between creating the log and calling Twilio
    // Scheduled job picks these up and retries them
    // -------------------------------------------------------
    @Query("""
        SELECT n FROM NotificationLog n
        WHERE n.status = 'PENDING'
        AND n.createdAt < :cutoff
        ORDER BY n.createdAt ASC
        """)
    List<NotificationLog> findStuckPending(@Param("cutoff") LocalDateTime cutoff);

    // -------------------------------------------------------
    // Delete old notification logs
    // Called by scheduled cleanup job monthly
    // Keeps the table from growing indefinitely
    // Only deletes DELIVERED and SKIPPED records
    // FAILED records kept for investigation
    // -------------------------------------------------------
    @Query("""
        DELETE FROM NotificationLog n
        WHERE n.status IN ('DELIVERED', 'SKIPPED')
        AND n.createdAt < :cutoff
        """)
    void deleteOldLogs(@Param("cutoff") LocalDateTime cutoff);
}
