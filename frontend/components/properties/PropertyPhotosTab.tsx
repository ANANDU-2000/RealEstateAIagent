'use client';

import { useState } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  addPropertyPhoto,
  deletePropertyPhoto,
  type PropertyPhoto,
} from '@/lib/api';

type PropertyPhotosTabProps = {
  token: string;
  propertyId: string;
  photos: PropertyPhoto[];
  onPhotosChange: (photos: PropertyPhoto[]) => void;
};

export function PropertyPhotosTab({
  token,
  propertyId,
  photos,
  onPhotosChange,
}: PropertyPhotosTabProps) {
  const [url, setUrl] = useState('');
  const [isCover, setIsCover] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setAdding(true);
    setError(null);
    try {
      const result = await addPropertyPhoto(token, propertyId, {
        url: url.trim(),
        isCover: isCover || photos.length === 0,
        sortOrder: photos.length,
      });
      const next = isCover || photos.length === 0
        ? photos.map((p) => ({ ...p, isCover: false })).concat(result.photo)
        : [...photos, result.photo];
      onPhotosChange(next);
      setUrl('');
      setIsCover(false);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not add photo.'
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(photoId: string) {
    setBusyPhotoId(photoId);
    setError(null);
    try {
      await deletePropertyPhoto(token, propertyId, photoId);
      onPhotosChange(photos.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not delete photo.'
      );
    } finally {
      setBusyPhotoId(null);
    }
  }

  async function handleSetCover(photo: PropertyPhoto) {
    if (photo.isCover) return;

    setBusyPhotoId(photo.id);
    setError(null);
    try {
      await deletePropertyPhoto(token, propertyId, photo.id);
      const result = await addPropertyPhoto(token, propertyId, {
        url: photo.url,
        caption: photo.caption ?? undefined,
        isCover: true,
        sortOrder: photo.sortOrder,
      });
      onPhotosChange(
        photos
          .filter((p) => p.id !== photo.id)
          .map((p) => ({ ...p, isCover: false }))
          .concat(result.photo)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not set cover photo.'
      );
    } finally {
      setBusyPhotoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e) => void handleAdd(e)} className="flex flex-col gap-3">
        <Input
          label="Photo URL"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          hint="Paste a public image URL (R2 upload coming soon)"
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isCover}
            onChange={(e) => setIsCover(e.target.checked)}
            className="rounded border-border"
          />
          Set as cover photo
        </label>
        <Button type="submit" loading={adding} disabled={!url.trim()} className="self-start">
          <ImagePlus className="h-4 w-4" />
          Add Photo
        </Button>
      </form>

      {error && <Alert variant="error">{error}</Alert>}

      {photos.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="No photos yet"
          description="Add a photo URL to help buyers see the property."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-shadow hover:shadow-[var(--shadow-sm)]"
            >
              <div className="aspect-[4/3] bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                {photo.isCover ? (
                  <Badge variant="primary">Cover</Badge>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={busyPhotoId === photo.id}
                    onClick={() => void handleSetCover(photo)}
                  >
                    <Star className="h-4 w-4" />
                    Set cover
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={busyPhotoId === photo.id}
                  onClick={() => void handleDelete(photo.id)}
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
