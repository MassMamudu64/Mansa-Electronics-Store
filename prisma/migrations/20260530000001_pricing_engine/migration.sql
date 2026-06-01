-- =============================================================================
-- Pricing engine — WeSellCellular integration.
-- Adds: wholesale_sources, wholesale_listings, pricing_rules, price_quotes,
-- price_history. All tables are admin-controlled; no public read paths.
-- =============================================================================

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE "WholesaleSourceStatus" AS ENUM ('idle', 'syncing', 'ok', 'error');
CREATE TYPE "PricingRuleScope"      AS ENUM ('global', 'category', 'brand', 'sku');
CREATE TYPE "PriceHistorySource"    AS ENUM ('manual', 'rule_apply', 'bulk_import', 'wholesale_sync');

-- ─── wholesale_sources ───────────────────────────────────────────────────────
CREATE TABLE "wholesale_sources" (
    "id"              TEXT NOT NULL,
    "name"            VARCHAR(100) NOT NULL,
    "base_url"        VARCHAR(500),
    "status"          "WholesaleSourceStatus" NOT NULL DEFAULT 'idle',
    "last_synced_at"  TIMESTAMP(3),
    "last_error"      TEXT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wholesale_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wholesale_sources_name_key" ON "wholesale_sources"("name");

-- ─── wholesale_listings ──────────────────────────────────────────────────────
CREATE TABLE "wholesale_listings" (
    "id"               TEXT NOT NULL,
    "source_id"        TEXT NOT NULL,
    "external_id"      VARCHAR(100),
    "sku"              VARCHAR(100) NOT NULL,
    "name"             VARCHAR(300) NOT NULL,
    "brand"            VARCHAR(100),
    "model"            VARCHAR(200),
    "condition"        VARCHAR(50),
    "storage"          VARCHAR(50),
    "color"            VARCHAR(100),
    "carrier"          VARCHAR(100),
    "wholesale_price"  DECIMAL(10, 2) NOT NULL,
    "currency"         VARCHAR(3) NOT NULL DEFAULT 'USD',
    "in_stock"         BOOLEAN NOT NULL DEFAULT true,
    "stock_quantity"   INTEGER,
    "source_url"       VARCHAR(1000),
    "raw_payload"      JSONB,
    "scraped_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wholesale_listings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wholesale_listings_source_id_sku_key" ON "wholesale_listings"("source_id", "sku");
CREATE INDEX "wholesale_listings_sku_idx"        ON "wholesale_listings"("sku");
CREATE INDEX "wholesale_listings_scraped_at_idx" ON "wholesale_listings"("scraped_at");
CREATE INDEX "wholesale_listings_brand_idx"      ON "wholesale_listings"("brand");

ALTER TABLE "wholesale_listings"
    ADD CONSTRAINT "wholesale_listings_source_id_fkey"
    FOREIGN KEY ("source_id") REFERENCES "wholesale_sources"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── pricing_rules ───────────────────────────────────────────────────────────
CREATE TABLE "pricing_rules" (
    "id"             TEXT NOT NULL,
    "name"           VARCHAR(200) NOT NULL,
    "scope"          "PricingRuleScope" NOT NULL,
    "scope_value"    VARCHAR(100),
    "markup_pct"     DECIMAL(6, 3) NOT NULL,
    "floor_price"    DECIMAL(10, 2),
    "ceiling_price"  DECIMAL(10, 2),
    "priority"       INTEGER NOT NULL DEFAULT 0,
    "active"         BOOLEAN NOT NULL DEFAULT true,
    "updated_by"     VARCHAR(100),
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pricing_rules_active_idx" ON "pricing_rules"("active");
CREATE INDEX "pricing_rules_scope_idx"  ON "pricing_rules"("scope");

-- ─── price_quotes ────────────────────────────────────────────────────────────
CREATE TABLE "price_quotes" (
    "id"               TEXT NOT NULL,
    "sku"              VARCHAR(100) NOT NULL,
    "base_price"       DECIMAL(10, 2) NOT NULL,
    "applied_rule_id"  TEXT,
    "final_price"      DECIMAL(10, 2) NOT NULL,
    "currency"         VARCHAR(3) NOT NULL DEFAULT 'USD',
    "ip_address"       VARCHAR(45),
    "user_agent"       VARCHAR(500),
    "generated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_quotes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_quotes_sku_idx"          ON "price_quotes"("sku");
CREATE INDEX "price_quotes_generated_at_idx" ON "price_quotes"("generated_at");

ALTER TABLE "price_quotes"
    ADD CONSTRAINT "price_quotes_applied_rule_id_fkey"
    FOREIGN KEY ("applied_rule_id") REFERENCES "pricing_rules"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── price_history ───────────────────────────────────────────────────────────
CREATE TABLE "price_history" (
    "id"           TEXT NOT NULL,
    "product_id"   TEXT NOT NULL,
    "old_price"    DECIMAL(10, 2) NOT NULL,
    "new_price"    DECIMAL(10, 2) NOT NULL,
    "source"       "PriceHistorySource" NOT NULL,
    "rule_id"      TEXT,
    "changed_by"   VARCHAR(100),
    "note"         TEXT,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_history_product_id_idx" ON "price_history"("product_id");
CREATE INDEX "price_history_created_at_idx" ON "price_history"("created_at");

ALTER TABLE "price_history"
    ADD CONSTRAINT "price_history_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "price_history"
    ADD CONSTRAINT "price_history_rule_id_fkey"
    FOREIGN KEY ("rule_id") REFERENCES "pricing_rules"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
