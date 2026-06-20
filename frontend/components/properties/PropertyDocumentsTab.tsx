'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  deletePropertyDocument,
  listPropertyDocuments,
  uploadPropertyDocument,
  type PropertyDocument,
} from '@/lib/api';

type PropertyDocumentsTabProps = {
  token: string;
  propertyId: string;
};

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'ready') return 'success';
  if (status === 'processing') return 'warning';
  if (status === 'failed') return 'danger';
  return 'default';
}

export function PropertyDocumentsTab({ token, propertyId }: PropertyDocumentsTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPropertyDocuments(token, propertyId);
      setDocuments(result.documents);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load documents.'
      );
    } finally {
      setLoading(false);
    }
  }, [token, propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadPropertyDocument(token, propertyId, file);
      setDocuments((prev) => [result.document, ...prev]);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not upload document.'
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(docId: string) {
    setBusyId(docId);
    setError(null);
    try {
      await deletePropertyDocument(token, propertyId, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not delete document.'
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Upload PDF or text brochures. PropAgent extracts the text and uses it when buyers ask
        questions on WhatsApp.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <Button
          type="button"
          loading={uploading}
          iconLeft={<Upload className="h-4 w-4" />}
          onClick={() => inputRef.current?.click()}
        >
          Upload PDF or text file
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-muted">Loading documents…</p>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Add a brochure or floor plan PDF so the AI can answer buyer questions accurately."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-2 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{doc.filename}</p>
                {doc.errorMessage && (
                  <p className="mt-0.5 text-xs text-danger">{doc.errorMessage}</p>
                )}
              </div>
              <Badge variant={statusVariant(doc.status)}>{doc.status}</Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={busyId === doc.id}
                onClick={() => void handleDelete(doc.id)}
                aria-label={`Delete ${doc.filename}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
