-- Track WhatsApp verification test results (connected only after Meta accepts a send)
ALTER TABLE broker_settings
  ADD COLUMN IF NOT EXISTS last_whatsapp_test_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_whatsapp_test_ok BOOLEAN,
  ADD COLUMN IF NOT EXISTS last_whatsapp_error TEXT;

-- One-time reset was applied when this migration first shipped; do not repeat on redeploy.
