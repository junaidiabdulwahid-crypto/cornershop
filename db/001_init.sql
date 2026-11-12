-- CornerShop database.
-- Run once on PostgreSQL 16 with PostGIS: psql "$DATABASE_URL" -f db/001_init.sql
BEGIN;                                                    -- all or nothing

CREATE EXTENSION IF NOT EXISTS postgis;                   -- maps and distance
CREATE EXTENSION IF NOT EXISTS pgcrypto;                  -- gen_random_uuid()

CREATE TABLE users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phone       TEXT        NOT NULL UNIQUE,              -- one number, one user
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shops (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    name        TEXT        NOT NULL CHECK (btrim(name) <> ''),
    category    TEXT        NOT NULL,
    location    geography(Point, 4326) NOT NULL,          -- longitude, latitude
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX shops_location_idx ON shops USING GIST (location);   -- fast "who is nearby"

CREATE TABLE offers (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id           UUID          NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
    title             TEXT          NOT NULL,
    discount_percent  NUMERIC(5,2)  NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    daily_limit       INTEGER       NOT NULL DEFAULT 20 CHECK (daily_limit > 0),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX offers_shop_idx ON offers (shop_id, created_at DESC);

CREATE TABLE redemptions (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id         UUID           NOT NULL REFERENCES offers (id) ON DELETE RESTRICT,  -- money history stays
    user_id          UUID           NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    bill_amount      NUMERIC(12,2)  NOT NULL CHECK (bill_amount > 0),
    discount_amount  NUMERIC(12,2)  NOT NULL,
    payable_amount   NUMERIC(12,2)  NOT NULL,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CHECK (discount_amount + payable_amount = bill_amount)                              -- money always adds up
);
CREATE INDEX redemptions_offer_day_idx ON redemptions (offer_id, created_at);           -- fast "used today"

CREATE TABLE audit_logs (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id  UUID        NOT NULL REFERENCES users (id),
    action         TEXT        NOT NULL,
    entity_type    TEXT        NOT NULL,
    entity_id      UUID,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
