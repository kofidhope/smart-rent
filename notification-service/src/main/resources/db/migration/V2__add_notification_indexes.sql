
CREATE INDEX idx_notification_logs_booking_id ON notification_logs(booking_id);

CREATE INDEX idx_notification_logs_tenant_id ON notification_logs(tenant_id);

CREATE INDEX idx_notification_logs_status ON notification_logs(status);

CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);

CREATE INDEX idx_notification_logs_twilio_sid ON notification_logs(twilio_sid);

CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);