CREATE TABLE payments (
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
booking_id              UUID NOT NULL,
tenant_id               UUID NOT NULL,
owner_id                UUID NOT NULL,
amount                  NUMERIC(10, 2) NOT NULL,
currency                VARCHAR(10) NOT NULL DEFAULT 'GHS',
status                  VARCHAR(50) NOT NULL DEFAULT 'PENDING',
type                    VARCHAR(50) NOT NULL DEFAULT 'INITIALIZE',
paystack_reference      VARCHAR(255) UNIQUE,
paystack_access_code    VARCHAR(255),
authorization_url       VARCHAR(500),
authorization_code      VARCHAR(255),
channel                 VARCHAR(50),
failure_reason          VARCHAR(500),
paid_at                 TIMESTAMP,
created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);