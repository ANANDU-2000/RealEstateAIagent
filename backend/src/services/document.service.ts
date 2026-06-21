import pdfParse from 'pdf-parse';
import { pool } from '../db';

export const DOCUMENT_CHUNK_SIZE = 2400;

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    const parsed = await pdfParse(buffer);
    return parsed.text?.trim() ?? '';
  }

  if (
    mimeType.startsWith('text/') ||
    lower.endsWith('.txt') ||
    mimeType === 'application/octet-stream'
  ) {
    const text = buffer.toString('utf-8').trim();
    if (text.length > 0 && !text.includes('\u0000')) {
      return text;
    }
  }

  throw new Error('Unsupported file type. Upload a PDF or plain text (.txt) file.');
}

export function chunkText(text: string, maxLen = DOCUMENT_CHUNK_SIZE): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const piece = paragraph.trim();
    if (!piece) continue;

    const candidate = current ? `${current}\n\n${piece}` : piece;
    if (candidate.length <= maxLen) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);

    if (piece.length <= maxLen) {
      current = piece;
    } else {
      for (let i = 0; i < piece.length; i += maxLen) {
        chunks.push(piece.slice(i, i + maxLen));
      }
      current = '';
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function scoreChunk(chunkText: string, query: string): number {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
  if (!words.length) return 0;

  const lower = chunkText.toLowerCase();
  return words.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
}

export type DocumentChunkContext = {
  documentId: string;
  filename: string;
  chunkIndex: number;
  chunkText: string;
  propertyId: string | null;
};

export async function fetchRelevantDocumentChunks(
  tenantId: string,
  customerMessage: string,
  propertyId?: string | null,
  limit = 5
): Promise<DocumentChunkContext[]> {
  const params: unknown[] = [tenantId];
  let propertyFilter = '';
  if (propertyId) {
    params.push(propertyId);
    propertyFilter = ` AND (d.property_id = $2 OR d.property_id IS NULL)`;
  }

  const result = await pool.query<{
    document_id: string;
    filename: string;
    chunk_index: number;
    chunk_text: string;
    property_id: string | null;
  }>(
    `SELECT c.document_id, d.filename, c.chunk_index, c.chunk_text, d.property_id
     FROM tenant_document_chunks c
     JOIN tenant_documents d ON d.id = c.document_id
     WHERE c.tenant_id = $1
       AND d.status = 'ready'${propertyFilter}`,
    params
  );

  if (!result.rows.length) return [];

  const ranked = result.rows
    .map((row) => ({
      documentId: row.document_id,
      filename: row.filename,
      chunkIndex: row.chunk_index,
      chunkText: row.chunk_text,
      propertyId: row.property_id,
      score: scoreChunk(row.chunk_text, customerMessage),
    }))
    .sort((a, b) => b.score - a.score);

  const withHits = ranked.filter((r) => r.score > 0);
  let selected = (withHits.length ? withHits : ranked).slice(0, limit);

  if (!withHits.length && ranked.length > 0) {
    selected = ranked.slice(0, Math.min(3, limit));
  }

  const seen = new Set<string>();
  const deduped = selected.filter((row) => {
    const key = `${row.documentId}:${row.chunkIndex}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.map(({ documentId, filename, chunkIndex, chunkText, propertyId: pid }) => ({
    documentId,
    filename,
    chunkIndex,
    chunkText,
    propertyId: pid,
  }));
}

export async function storeDocumentChunks(
  tenantId: string,
  documentId: string,
  chunks: string[]
): Promise<void> {
  await pool.query(`DELETE FROM tenant_document_chunks WHERE document_id = $1 AND tenant_id = $2`, [
    documentId,
    tenantId,
  ]);

  for (let i = 0; i < chunks.length; i += 1) {
    await pool.query(
      `INSERT INTO tenant_document_chunks (tenant_id, document_id, chunk_index, chunk_text)
       VALUES ($1, $2, $3, $4)`,
      [tenantId, documentId, i, chunks[i]]
    );
  }
}
