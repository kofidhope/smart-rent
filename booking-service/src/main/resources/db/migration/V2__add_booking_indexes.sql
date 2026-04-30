CREATE INDEX idx_bookings_tenant_id    ON bookings(tenant_id);
CREATE INDEX idx_bookings_property_id  ON bookings(property_id);
CREATE INDEX idx_bookings_status       ON bookings(booking_status);