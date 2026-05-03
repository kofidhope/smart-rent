CREATE INDEX idx_payments_booking_id        ON payments(booking_id);
CREATE INDEX idx_payments_tenant_id         ON payments(tenant_id);
CREATE INDEX idx_payments_paystack_reference ON payments(paystack_reference);
CREATE INDEX idx_payments_status            ON payments(status);