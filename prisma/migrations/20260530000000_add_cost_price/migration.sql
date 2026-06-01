-- Adds the wholesale cost basis to products. Nullable so existing rows are
-- valid without backfill; the WeSellCellular pricing engine writes this field
-- for matched listings only. Retail price (`price`) remains the source of
-- truth for orders; cost_price is metadata for margin calculations.
ALTER TABLE "products"
  ADD COLUMN "cost_price" DECIMAL(10, 2);
