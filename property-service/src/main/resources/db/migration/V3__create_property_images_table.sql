CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id)ON DELETE CASCADE,
    image_url   VARCHAR(500) NOT NULL,
    public_id   VARCHAR(255) NOT NULL,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);