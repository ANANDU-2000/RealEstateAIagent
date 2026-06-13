-- M5: optional custom monthly price per client (Super Admin)
ALTER TABLE client_plans
  ADD COLUMN IF NOT EXISTS monthly_price_paise BIGINT,
  ADD COLUMN IF NOT EXISTS monthly_price_currency VARCHAR(5) DEFAULT 'INR';
