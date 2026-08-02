-- Add unit_id to bookings
-- Nullable at first for backwards compatibility
-- with any bookings that existed before units
ALTER TABLE bookings ADD COLUMN unit_id UUID;

-- Will add FK constraint after data migration
-- For now nullable to avoid breaking existing rows
CREATE INDEX idx_bookings_unit_id ON bookings(unit_id);

