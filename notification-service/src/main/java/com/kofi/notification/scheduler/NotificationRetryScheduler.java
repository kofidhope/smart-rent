package com.kofi.notification.scheduler;

import com.kofi.notification.model.NotificationChannel;
import com.kofi.notification.model.NotificationLog;
import com.kofi.notification.repository.NotificationLogRepository;
import com.kofi.notification.service.TwilioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Background jobs that keep notification_logs healthy.
 *
 * Three named jobs, no generic catch-all:
 *   1. retryPending          — every 5 min, re-send FAILED rows with retryCount < 3
 *   2. retryStuckPending     — every 15 min, rescue PENDING rows whose Twilio call
 *                              never completed (service crashed between log write
 *                              and Twilio call)
 *   3. cleanupOldLogs        — daily 02:00, delete DELIVERED + SKIPPED rows
 *                              older than 90 days. FAILED rows are kept for
 *                              investigation.
 *
 * Constraints preserved from the existing event-driven path:
 *   - Failures do NOT throw — a broken retry must not crash the scheduler thread.
 *   - Phone numbers are masked in logs (CLAUDE.md — sensitive data).
 *   - Idempotency is the responsibility of NotificationService.sendAndLog in the
 *     Kafka path; retries here are for individual log rows, not new events.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationRetryScheduler {

    private final NotificationLogRepository logRepository;
    private final TwilioService twilioService;

    /**
     * Retry FAILED notifications where retryCount < 3.
     * Runs every 5 minutes.
     *
     * findRetryEligible already excludes rows whose failureReason looks like
     * a permanent error ("invalid phone", "unsubscribed") and rows older than
     * the cutoff (10 minutes ago — so we don't retry things that just failed).
     */
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void retryPending() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(10);
        List<NotificationLog> eligible = logRepository.findRetryEligible(cutoff);

        if (eligible.isEmpty()) {
            log.debug("retryPending — no eligible FAILED notifications");
            return;
        }

        log.info("retryPending — found {} eligible FAILED notifications", eligible.size());

        for (NotificationLog logRow : eligible) {
            resend(logRow);
        }
    }

    /**
     * Rescue PENDING notifications older than 5 minutes.
     *
     * These rows were written before the Twilio call but the call never
     * completed — usually a service crash between the log write and the
     * outbound HTTP. PENDING means retryCount is still 0 (markFailed bumps
     * it). We cap at < 3 attempts like the FAILED path.
     */
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void retryStuckPending() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(5);
        List<NotificationLog> stuck = logRepository.findStuckPending(cutoff);

        if (stuck.isEmpty()) {
            log.debug("retryStuckPending — no stuck PENDING notifications");
            return;
        }

        // Defence-in-depth: the repo query doesn't gate on retryCount, so
        // skip anything that has already been tried too many times.
        List<NotificationLog> retryable = stuck.stream()
                .filter(n -> n.getRetryCount() < 3)
                .toList();

        if (retryable.isEmpty()) {
            return;
        }

        log.info("retryStuckPending — found {} stuck PENDING notifications to retry",
                retryable.size());

        for (NotificationLog logRow : retryable) {
            resend(logRow);
        }
    }

    /**
     * Delete DELIVERED + SKIPPED rows older than 90 days.
     * Runs daily at 02:00 server time.
     *
     * FAILED rows are kept — they're useful for support investigation.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        log.info("cleanupOldLogs — deleting DELIVERED + SKIPPED logs older than {}",
                cutoff);
        try {
            logRepository.deleteOldLogs(cutoff);
        } catch (Exception e) {
            // Don't propagate — cleanup failure must not kill the scheduler.
            log.error("cleanupOldLogs — failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Shared resend path used by both retry jobs.
     *
     * Same masking + non-throwing contract as NotificationService.sendAndLog:
     * any Twilio failure is recorded on the row but never rethrown, so a
     * bad number can't take down the whole retry batch.
     */
    private void resend(NotificationLog logRow) {
        try {
            String sid;
            if (logRow.getChannel() == NotificationChannel.WHATSAPP) {
                sid = twilioService.sendWhatsApp(
                        logRow.getRecipientPhone(),
                        logRow.getMessageBody());
            } else {
                sid = twilioService.sendSms(
                        logRow.getRecipientPhone(),
                        logRow.getMessageBody());
            }

            logRow.markSent(sid);
            logRepository.save(logRow);

            log.info("Retry SENT — id: {} type: {} retryCount: {} to: {}",
                    logRow.getId(), logRow.getType(),
                    logRow.getRetryCount(), maskPhone(logRow.getRecipientPhone()));

        } catch (Exception e) {
            logRow.markFailed(e.getMessage());
            logRepository.save(logRow);

            log.warn("Retry FAILED — id: {} type: {} retryCount: {} to: {} error: {}",
                    logRow.getId(), logRow.getType(),
                    logRow.getRetryCount(),
                    maskPhone(logRow.getRecipientPhone()),
                    e.getMessage());
        }
    }

    // Phone masking — same shape as NotificationService.maskPhone.
    // Kept private here because the scheduler does not depend on
    // NotificationService and we don't want to widen that surface.
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 6) {
            return "***";
        }
        return phone.substring(0, 4) + "*****" + phone.substring(phone.length() - 3);
    }
}