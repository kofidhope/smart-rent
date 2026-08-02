-- A unit is the actual rentable item inside a property
--  can have one or many units
-- Bookings will reference units not properties directly
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Which property this unit belongs to
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    -- Human-readable unit identifier
    -- "Whole House", "Room A1", "Apartment 101"
    name VARCHAR(100) NOT NULL,
    -- Optional description specific to this unit
    -- e.g. "Ground floor, sea view, en-suite"
    description TEXT,
    -- Monthly rent for THIS unit specifically
    -- Overrides property price when set
    -- NULL means use the property price
    price_override  DECIMAL(10, 2),
    -- Bedrooms in this specific unit
    -- Overrides property bedrooms when set
    bedrooms_override INTEGER,
    -- Bathrooms in this specific unit
    bathrooms_override INTEGER,
    -- AVAILABLE, RENTED, MAINTENANCE
    -- Each unit has its own availability status
    status VARCHAR(50) NOT NULl DEFAULT 'AVAILABLE',
    -- Display order within the property
    -- Unit 1 shows before Unit 2 in listings
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_units_property_id ON units(property_id);

CREATE INDEX idx_units_status ON units(status);

-- Every existing property gets one default unit
-- named "Whole Property" — this preserves
-- backwards compatibility for existing bookings
-- The unit gets the property's price and room counts
INSERT INTO units (
    id,
    property_id,
    name,
    description,
    price_override,
    bedrooms_override,
    bathrooms_override,
    status,
    display_order,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    'Whole Property',
    description,
    price,
    bedrooms,
    bathrooms,
    status,
    0,
    NOW(),
    NOW()
FROM properties;