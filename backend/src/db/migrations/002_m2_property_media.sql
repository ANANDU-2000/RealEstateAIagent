-- M2: Property videos & documents
CREATE TABLE IF NOT EXISTS property_videos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  provider     VARCHAR(20) DEFAULT 'youtube',
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url                   TEXT NOT NULL,
  doc_type              VARCHAR(50) NOT NULL,
  visible_to_customer   BOOLEAN DEFAULT false,
  file_size_kb          INTEGER,
  uploaded_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_videos_property ON property_videos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_property ON property_documents(property_id);
