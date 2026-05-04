package com.kofi.paymentservice.repository;

import com.kofi.paymentservice.model.Payment;
import com.kofi.paymentservice.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByBookingId(UUID bookingId);

    Optional<Payment> findByPaystackReference(String paystackReference);

    // Used in processBookingPayment to prevent duplicate
    boolean existsByBookingId(UUID bookingId);

    // Find all payments for a tenant
    // Used for tenant payment history screen
    List<Payment> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    // Find all payments for an owner
    // Used for landlord revenue dashboard
    List<Payment> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Payment> findByStatus(PaymentStatus status);

    // Find PROCESSING payments older than a given time
    // A payment stuck in PROCESSING for more than 30 minutes
    // means Paystack never sent a webhook — either it failed
    // silently or the webhook was missed.
    // A scheduled job calls this to flag them for retry
    @Query("""
        SELECT p FROM Payment p
        WHERE p.status = 'PROCESSING'
        AND p.createdAt < :cutoff
        ORDER BY p.createdAt ASC
        """)
    List<Payment> findStuckPayments(@Param("cutoff") LocalDateTime cutoff);

    Optional<Payment> findFirstByTenantIdAndAuthorizationCodeIsNotNull(UUID tenantId);

    // -------------------------------------------------------
    // Bulk status update — used by reconciliation jobs
    // Updates multiple stuck payments to FAILED at once
    // @Modifying required for UPDATE/DELETE JPQL queries
    // @Transactional on the calling service method handles
    // the transaction — do not add it here
    // -------------------------------------------------------
    @Modifying
    @Query("""
        UPDATE Payment p
        SET p.status = :status,
            p.failureReason = :reason
        WHERE p.id IN :ids
        """)
    void bulkUpdateStatus(
            @Param("ids") List<UUID> ids,
            @Param("status") PaymentStatus status,
            @Param("reason") String reason
    );

    // Count payments by status for a tenant
    // Used for dashboard statistics
    // e.g. "You have 3 successful payments"
    long countByTenantIdAndStatus(UUID tenantId, PaymentStatus status);

    // Count payments by status for an owner
    // Used for landlord revenue reporting
    long countByOwnerIdAndStatus(UUID ownerId, PaymentStatus status);

    // Sum of successful payment amounts for an owner
    // Used for total revenue calculation on dashboard
    // Returns null if no payments exist — handle in service
    @Query("""
        SELECT SUM(p.amount) FROM Payment p
        WHERE p.ownerId = :ownerId
        AND p.status = 'SUCCESS'
        """)
    BigDecimal sumSuccessfulAmountByOwnerId(@Param("ownerId") Long ownerId);
}
