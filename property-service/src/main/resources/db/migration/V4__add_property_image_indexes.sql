CREATE INDEX idx_property_images_property_id ON property_images(property_id);

-- Only one primary image per property
CREATE UNIQUE INDEX idx_property_images_primary ON property_images(property_id) WHERE is_primary = TRUE;