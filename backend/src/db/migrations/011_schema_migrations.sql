-- Bootstrap schema_migrations for databases that already had migrations applied manually
INSERT INTO schema_migrations (filename) VALUES
  ('001_m1_properties_status.sql'),
  ('002_m2_property_media.sql'),
  ('003_m3_broker_settings.sql'),
  ('004_conversations_read.sql'),
  ('005_client_plan_pricing.sql'),
  ('006_ai_failures.sql'),
  ('007_tenant_documents.sql'),
  ('008_whatsapp_test_status.sql'),
  ('009_webhook_received_at.sql'),
  ('010_conversation_story.sql')
ON CONFLICT (filename) DO NOTHING;
