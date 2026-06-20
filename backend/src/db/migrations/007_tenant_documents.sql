-- Tenant-scoped property documents for AI context (text chunks, optional file URL)
CREATE TABLE IF NOT EXISTS tenant_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id  UUID REFERENCES properties(id) ON DELETE CASCADE,
  filename     VARCHAR(255) NOT NULL,
  file_url     TEXT,
  mime_type    VARCHAR(100),
  status       VARCHAR(20) NOT NULL DEFAULT 'processing',
  error_message TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id  UUID NOT NULL REFERENCES tenant_documents(id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL,
  chunk_text   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_documents_tenant ON tenant_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_property ON tenant_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_document_chunks_document ON tenant_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_tenant_document_chunks_tenant ON tenant_document_chunks(tenant_id);
