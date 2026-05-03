CREATE TABLE bookings (
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id           UUID  NOT NULL,
property_id         UUID NOT NULL,
owner_id            UUID  NOT NULL,
start_date          DATE NOT NULL,
end_date            DATE NOT NULL,
total_price         NUMERIC(10, 2) NOT NULL,
booking_status      VARCHAR(50) NOT NULL DEFAULT 'PENDING',
payment_status      VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
paystack_payment_id   VARCHAR(255),
failure_reason      VARCHAR(500),
created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);