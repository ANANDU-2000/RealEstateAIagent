-- Track WhatsApp verification test results (connected only after Meta accepts a send)
ALTER TABLE broker_settings
  ADD COLUMN IF NOT EXISTS last_whatsapp_test_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_whatsapp_test_ok BOOLEAN,
  ADD COLUMN IF NOT EXISTS last_whatsapp_error TEXT;

-- Reset misleading connected state until a successful test
UPDATE broker_settings
SET whatsapp_connected = false,
    whatsapp_connected_at = NULL
WHERE whatsapp_connected = true
  AND (last_whatsapp_test_ok IS DISTINCT FROM true);
