CREATE TABLE notification_logs (
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
booking_id          UUID,
tenant_id           UUID NOT NULL,
notification_type   VARCHAR(50) NOT NULL,
channel             VARCHAR(20) NOT NULL,
status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
recipient_phone     VARCHAR(20),
recipient_email     VARCHAR(255),
message_body        TEXT NOT NULL,
twilio_sid          VARCHAR(50),
failure_reason      VARCHAR(500),
retry_count         INTEGER NOT NULL DEFAULT 0,
sent_at             TIMESTAMP,
created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);