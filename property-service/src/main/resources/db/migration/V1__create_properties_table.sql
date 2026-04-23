CREATE TABLE properties (
 id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id    UUID NOT NULL,
 title       VARCHAR(200) NOT NULL,
 description TEXT,
 address     VARCHAR(500) NOT NULL,
 city        VARCHAR(100) NOT NULL,
 price       NUMERIC(10, 2) NOT NULL,
 type        VARCHAR(50) NOT NULL,
 status      VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
 bedrooms    INTEGER NOT NULL DEFAULT 1,
 bathrooms   INTEGER NOT NULL DEFAULT 1,
 created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
 updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);