-- Shop reviews. Run after 001_init.sql. An old file is history; a change is a new file.
BEGIN;

CREATE TABLE reviews (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id     UUID        NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT        NOT NULL CHECK (btrim(comment) <> '' AND length(comment) <= 300),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (shop_id, user_id)                              -- one review per person per shop
);
CREATE INDEX reviews_shop_idx ON reviews (shop_id, created_at DESC);

COMMIT;
