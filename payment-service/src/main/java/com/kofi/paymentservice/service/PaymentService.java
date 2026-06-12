package com.kofi.paymentservice.service;

import com.kofi.paymentservice.dto.PaystackInitializeResponse;
import com.kofi.paymentservice.dto.PaystackVerifyResponse;
import com.kofi.paymentservice.dto.PaystackWebhookPayload;
import com.kofi.paymentservice.event.BookingConfirmedEvent;
import com.kofi.paymentservice.event.PaymentEventPublisher;
import com.kofi.paymentservice.exception.PaymentNotFoundException;
import com.kofi.paymentservice.exception.UnauthorizedAccessException;
import com.kofi.paymentservice.model.Payment;
import com.kofi.paymentservice.model.PaymentStatus;
import com.kofi.paymentservice.model.PaymentType;
import com.kofi.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaystackService paystackService;
    private final PaymentEventPublisher eventPublisher;

    // PROCESS BOOKING PAYMENT
    // Entry point — called by BookingEventListener when
    // BookingConfirmedEvent arrives from Kafka
    // Two paths:
    //   1. Tenant has no saved card → initialize transaction
    //      → return authorization_url for tenant to visit
    //   2. Tenant has saved card → charge authorization
    //      → Paystack charges immediately, webhook arrives
    @Transactional
    public void processBookingPayment(BookingConfirmedEvent event) {

        log.info("Processing payment — bookingId: {} " + "tenantId: {} amount: {} GHS",
                event.getBookingId(),
                event.getTenantId(),
                event.getAmount());

        // Idempotency guard
        if (paymentRepository.existsByBookingId(event.getBookingId())) {
            log.warn("Payment already exists for " + "bookingId: {} — skipping duplicate event",
                    event.getBookingId());
            return;
        }

        // Validate email
        // Paystack requires a valid email for every transaction
        // Empty email means user-service fallback was used
        if (event.getTenantEmail() == null || event.getTenantEmail().isBlank()) {
            log.error("Cannot process payment — " + "tenant email is empty for bookingId: {}", event.getBookingId());

            eventPublisher.publishPaymentFailed(
                    event.getBookingId(),
                    event.getTenantId(),
                    "Tenant email unavailable — " + "user-service was unreachable",
                    "MISSING_EMAIL"
            );
            return;
        }

        // Generate unique reference
        String reference = paystackService.generateReference(event.getBookingId());

        // Check for saved authorization code
        // If tenant has paid before, charge their saved card
        // directly — no browser redirect needed
        var existingAuth = paymentRepository.findFirstByTenantIdAndAuthorizationCodeIsNotNull(event.getTenantId());

        if (existingAuth.isPresent()) {
            log.info("Tenant {} has saved authorization — " + "using charge_authorization flow",
                    event.getTenantId());

            processChargeAuthorization(
                    event,
                    existingAuth.get().getAuthorizationCode(),
                    reference
            );
        } else {
            log.info("Tenant {} has no saved authorization — " + "using initialize flow",
                    event.getTenantId());
            processInitialize(event, reference);
        }
    }

    // HANDLE WEBHOOK
    // Called by PaystackWebhookController after signature
    @Transactional
    public void handleWebhook(PaystackWebhookPayload payload) {

        String eventType = payload.getEvent();
        String reference = payload.getData().getReference();

        log.info("Handling webhook — event: {} reference: {}", eventType, reference);

        // Find payment record by reference
        // This is the anchor linking Paystack to our DB
        Payment payment = paymentRepository
                .findByPaystackReference(reference)
                .orElseThrow(() -> {
                    log.error("Payment not found for " + "reference: {} event: {}", reference, eventType);
                    return new PaymentNotFoundException("Payment not found for reference: " + reference);
                });

        // Route to correct handler based on event type
        switch (eventType) {

            case "charge.success" ->
                    handleChargeSuccess(payment, payload);

            case "charge.failed" ->
                    handleChargeFailed(
                            payment,
                            payload,
                            "Paystack charge failed"
                    );

            case "charge.dispute.create" ->
                    log.warn("Dispute raised for payment {} — " + "bookingId: {} amount: {} GHS",
                            payment.getId(),
                            payment.getBookingId(),
                            payment.getAmount());

            case "refund.processed" ->
                    handleRefundProcessed(payment);

            default ->
                    log.info("Unhandled webhook event: {} — " + "no action taken", eventType);
        }
    }

    @Transactional(readOnly = true)
    public Payment getPaymentByBookingId(UUID bookingId, UUID requesterId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for bookingId: " + bookingId));

        // Enforce Access Control
        if (!payment.getTenantId().equals(requesterId) && !payment.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedAccessException("You do not have permission to view this payment record.");
        }
        return payment;
    }

    // GET TENANT PAYMENT HISTORY
    // All payments for a tenant — newest first
    @Transactional(readOnly = true)
    public List<Payment> getTenantPayments(UUID tenantId) {
        return paymentRepository
                .findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    // GET OWNER REVENUE
    // All successful payments for a landlord
    @Transactional(readOnly = true)
    public List<Payment> getOwnerPayments(UUID ownerId) {
        return paymentRepository
                .findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    // GET OWNER TOTAL REVENUE
    // Sum of all successful payments for a landlord
    @Transactional(readOnly = true)
    public BigDecimal getOwnerTotalRevenue(UUID ownerId) {
        BigDecimal total = paymentRepository
                .sumSuccessfulAmountByOwnerId(ownerId);
        return total != null ? total : BigDecimal.ZERO;
    }

    // RECONCILE STUCK PAYMENTS
    // Called by a scheduled job every 30 minutes
    // Finds PROCESSING payments older than 30 minutes
    // Verifies each one directly with Paystack
    // Updates status based on actual Paystack state
    @Transactional
    public void reconcileStuckPayments() {

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);

        List<Payment> stuckPayments = paymentRepository.findStuckPayments(cutoff);

        if (stuckPayments.isEmpty()) {
            log.info("Reconciliation — no stuck payments found");
            return;
        }

        log.warn("Reconciliation — found {} stuck payments", stuckPayments.size());

        for (Payment payment : stuckPayments) {
            reconcilePayment(payment);
        }
    }

    // Private methods

    // Path 1 — Initialize transaction for new tenants
    private void processInitialize(BookingConfirmedEvent event, String reference) {
        // Save payment in PENDING state before calling Paystack
        // If Paystack call fails, we have a record to debug
        Payment payment = Payment.builder()
                .bookingId(event.getBookingId())
                .tenantId(event.getTenantId())
                .ownerId(event.getOwnerId())
                .amount(event.getAmount())
                .currency("GHS")
                .status(PaymentStatus.PENDING)
                .type(PaymentType.INITIALIZE)
                .paystackReference(reference)
                .build();

        Payment saved = paymentRepository.save(payment);

        log.info("Payment record created — id: {} " + "reference: {} status: PENDING", saved.getId(), reference);

        try {
            // Call Paystack — get authorization URL
            PaystackInitializeResponse response =
                    paystackService.initializeTransaction(
                            event.getTenantEmail(),
                            event.getAmount(),
                            reference,
                            event.getBookingId().toString(),
                            event.getTenantId(),
                            event.getPropertyTitle()
                    );

            // Advance payment to PROCESSING
            // Tenant now needs to visit authorizationUrl
            saved.setStatus(PaymentStatus.PROCESSING);
            saved.setPaystackAccessCode(response.getData().getAccessCode());
            saved.setAuthorizationUrl(response.getData().getAuthorizationUrl());
            paymentRepository.save(saved);

            log.info("Payment initialized — id: {} " + "reference: {} authUrl: {} " + "status: PROCESSING",
                    saved.getId(),
                    reference,
                    response.getData().getAuthorizationUrl());

            // notification-service will SMS the tenant
            // the authorization URL so they can pay
            // It consumes the BookingConfirmedEvent directly
            // We don't need to publish anything extra here
            // The flow resumes when Paystack calls our webhook

        } catch (Exception e) {
            log.error("Paystack initialize failed — " + "bookingId: {} reference: {} error: {}",
                    event.getBookingId(), reference,
                    e.getMessage());

            // Mark payment as failed
            saved.setStatus(PaymentStatus.FAILED);
            saved.setFailureReason("Initialization failed: " + e.getMessage());
            paymentRepository.save(saved);

            // Tell booking-service to cancel the booking
            eventPublisher.publishPaymentFailed(
                    event.getBookingId(),
                    event.getTenantId(),
                    "Payment initialization failed: " + e.getMessage(),
                    "INIT_FAILED"
            );
        }
    }

    // Path 2 — Charge saved authorization for returning tenants
    private void processChargeAuthorization(BookingConfirmedEvent event, String authorizationCode, String reference) {

        // Save payment record
        Payment payment = Payment.builder()
                .bookingId(event.getBookingId())
                .tenantId(event.getTenantId())
                .ownerId(event.getOwnerId())
                .amount(event.getAmount())
                .currency("GHS")
                .status(PaymentStatus.PENDING)
                .type(PaymentType.CHARGE)
                .paystackReference(reference)
                .authorizationCode(authorizationCode)
                .build();

        Payment saved = paymentRepository.save(payment);

        try {
            // Charge immediately — Paystack processes and
            // sends webhook. No tenant interaction needed.
            PaystackVerifyResponse response =
                    paystackService.chargeAuthorization(
                            authorizationCode,
                            event.getTenantEmail(),
                            event.getAmount(),
                            reference
                    );

            saved.setStatus(PaymentStatus.PROCESSING);
            paymentRepository.save(saved);

            log.info("Charge authorization sent — " + "bookingId: {} reference: {} " + "Paystack status: {}",
                    event.getBookingId(), reference,
                    response.getData() != null ? response.getData().getStatus() : "pending");

            // Wait for webhook — same as initialize flow
            // charge.success or charge.failed will arrive

        } catch (Exception e) {
            log.error("Charge authorization failed — " + "bookingId: {} reference: {} error: {}",
                    event.getBookingId(), reference,
                    e.getMessage());

            saved.setStatus(PaymentStatus.FAILED);
            saved.setFailureReason("Charge failed: " + e.getMessage());
            paymentRepository.save(saved);

            eventPublisher.publishPaymentFailed(
                    event.getBookingId(),
                    event.getTenantId(),
                    "Card charge failed: " + e.getMessage(),
                    "CHARGE_FAILED"
            );
        }
    }

    // Webhook handler — charge succeeded
    private void handleChargeSuccess(Payment payment, PaystackWebhookPayload payload) {

        // Idempotency — skip if already processed
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.warn("Payment {} already SUCCESS — " + "duplicate webhook ignored", payment.getId());
            return;
        }

        log.info("Handling charge.success — " + "payment: {} reference: {}", payment.getId(), payment.getPaystackReference());

        // Verify independently with Paystack
        // Never trust webhook alone — verify the transaction
        // directly to confirm money actually moved
        PaystackVerifyResponse verification;
        try {
            verification = paystackService
                    .verifyTransaction(payment.getPaystackReference());
        } catch (Exception e) {
            log.error("Verification failed for payment {} — " + "error: {} — treating as failed",
                    payment.getId(), e.getMessage());
            handleChargeFailed(
                    payment,
                    payload,
                    "Verification call failed: " + e.getMessage()
            );
            return;
        }

        String verifiedStatus = verification.getData()
                .getStatus();

        // Verification contradicts webhook — treat as failed
        if (!"success".equals(verifiedStatus)) {
            log.error("Webhook says success but verify " + "says {} — payment: {} reference: {}",
                    verifiedStatus,
                    payment.getId(),
                    payment.getPaystackReference());
            handleChargeFailed(
                    payment,
                    payload,
                    "Verification status mismatch: "
                            + verifiedStatus
            );
            return;
        }

        // Amount integrity check
        // Confirm Paystack charged the correct
        // Amount from Paystack is in pesewas — convert to GHS
        if (verification.getData().getAmount() != null) {
            BigDecimal chargedAmount = BigDecimal.valueOf(verification.getData().getAmount())
                    .divide(BigDecimal.valueOf(100));

            if (chargedAmount.compareTo(payment.getAmount()) != 0) {
                log.error("Amount mismatch — expected: {} GHS " + "charged: {} GHS payment: {}",
                        payment.getAmount(),
                        chargedAmount,
                        payment.getId());
                // Log and continue — do not fail the payment
                // Amount mismatch needs human review but
                // the charge was real. Failing would confuse
                // a tenant who actually paid.
            }
        }

        // ── Update payment record ────────────────────────────
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment.setChannel(payload.getData().getChannel());

        // Store authorization code for future charges
        if (payload.getData().getAuthorization() != null
                && "1".equals(verification.getData().getAuthorization() != null
                ? verification.getData().getAuthorization().getReusable() : "0")) {
            payment.setAuthorizationCode(payload.getData().getAuthorization().getAuthorizationCode());

            log.info("Authorization code stored for " + "tenant {} — future bookings will " + "use charge_authorization flow",
                    payment.getTenantId());
        }

        paymentRepository.save(payment);

        log.info("Payment SUCCESS — id: {} bookingId: {} " + "amount: {} GHS channel: {} reference: {}",
                payment.getId(),
                payment.getBookingId(),
                payment.getAmount(),
                payment.getChannel(),
                payment.getPaystackReference());

        // Publish success event
        // booking-service → confirms booking (CONFIRMED)
        // notification-service → SMS "Booking confirmed"
        eventPublisher.publishPaymentSucceeded(
                payment.getBookingId(),
                payment.getPaystackReference(),
                payment.getAmount(),
                payment.getTenantId(),
                payload.getData().getCustomer() != null ? payload.getData().getCustomer().getEmail() : "");
    }

    // Webhook handler — charge failed
    private void handleChargeFailed(Payment payment, PaystackWebhookPayload payload, String reason) {

        // Idempotency — skip if already processed
        if (payment.getStatus() == PaymentStatus.FAILED) {
            log.warn("Payment {} already FAILED — " + "duplicate webhook ignored", payment.getId());
            return;
        }

        String failureReason = reason != null ? reason : (payload.getData().getGatewayResponse() != null ? payload.getData().getGatewayResponse() : "Payment failed");

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(failureReason);
        paymentRepository.save(payment);

        log.info("Payment FAILED — id: {} bookingId: {} " + "reason: {} reference: {}",
                payment.getId(),
                payment.getBookingId(),
                failureReason,
                payment.getPaystackReference());

        // booking-service → cancels booking (CANCELLED)
        // notification-service → SMS "Payment failed"
        eventPublisher.publishPaymentFailed(
                payment.getBookingId(),
                payment.getTenantId(),
                failureReason,
                payload.getData().getGatewayResponse() != null
                        ? payload.getData().getGatewayResponse()
                        : "CHARGE_FAILED"
        );
    }

    // Webhook handler — refund processed
    private void handleRefundProcessed(Payment payment) {

        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

        log.info("Payment REFUNDED — id: {} bookingId: {}",
                payment.getId(),
                payment.getBookingId());

        // Future: publish PaymentRefundedEvent so
        // booking-service can mark booking as cancelled
        // and notification-service can SMS the tenant
    }

    // Reconcile a single stuck payment
    private void reconcilePayment(Payment payment) {
        log.info("Reconciling stuck payment — " + "id: {} reference: {} age: {} minutes",
                payment.getId(),
                payment.getPaystackReference(),
                Duration.between(payment.getCreatedAt(), LocalDateTime.now()).toMinutes());

        try {
            PaystackVerifyResponse verification = paystackService.verifyTransaction(payment.getPaystackReference());

            String paystackStatus = verification.getData().getStatus();

            switch (paystackStatus) {
                case "success" -> {
                    log.info("Reconciliation — payment {} " + "is actually SUCCESS at Paystack", payment.getId());
                    // Build a minimal webhook payload
                    // and pass through normal success handler
                    payment.setStatus(PaymentStatus.SUCCESS);
                    payment.setPaidAt(LocalDateTime.now());
                    if (verification.getData().getAuthorization() != null) {
                        payment.setAuthorizationCode(
                                verification.getData()
                                        .getAuthorization()
                                        .getAuthorizationCode());
                    }
                    paymentRepository.save(payment);

                    eventPublisher.publishPaymentSucceeded(
                            payment.getBookingId(),
                            payment.getPaystackReference(),
                            payment.getAmount(),
                            payment.getTenantId(),
                            ""
                    );
                }
                case "failed", "abandoned" -> {
                    log.info("Reconciliation — payment {} " + "status at Paystack: {}", payment.getId(), paystackStatus);

                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setFailureReason("Reconciled as " + paystackStatus + " by scheduled job");
                    paymentRepository.save(payment);

                    eventPublisher.publishPaymentFailed(
                            payment.getBookingId(),
                            payment.getTenantId(),
                            "Payment " + paystackStatus,
                            paystackStatus.toUpperCase()
                    );
                }
                default ->
                        log.info("Reconciliation — payment {} " + "still {} at Paystack — will " + "check again next cycle", payment.getId(), paystackStatus);
            }
        } catch (Exception e) {
            log.error("Reconciliation failed for payment {} — " + "error: {}", payment.getId(), e.getMessage());
        }
    }
}
