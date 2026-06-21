'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  PropertyForm,
  formValuesToPayload,
  propertyToFormValues,
  type PropertyFormValues,
} from '@/components/properties/PropertyForm';
import { PropertyPhotosTab } from '@/components/properties/PropertyPhotosTab';
import { PropertyDocumentsTab } from '@/components/properties/PropertyDocumentsTab';
import { PropertyTagsTab } from '@/components/properties/PropertyTagsTab';
import { PageShell } from '@/components/layout/PageShell';
import { TabRow } from '@/components/layout/TabRow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  deleteProperty,
  getProperty,
  updateProperty,
  type Property,
  type PropertyPhoto,
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type FormTab = 'details' | 'photos' | 'documents' | 'tags';

const FORM_TABS: { id: FormTab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'photos', label: 'Photos' },
  { id: 'documents', label: 'Documents' },
  { id: 'tags', label: 'AI Tags' },
];

function validateForm(values: PropertyFormValues): Partial<Record<keyof PropertyFormValues, string>> {
  const errors: Partial<Record<keyof PropertyFormValues, string>> = {};
  if (values.name.trim().length < 2) errors.name = 'Property name is required';
  if (!values.city.trim()) errors.city = 'City is required';
  if (!values.location.trim()) errors.location = 'Locality is required';
  const price = Number(values.price);
  if (!values.price.trim() || !Number.isFinite(price) || price <= 0) {
    errors.price = 'Enter a valid price';
  }
  if (values.areaSize.trim()) {
    const area = Number(values.areaSize);
    if (!Number.isFinite(area) || area <= 0) errors.areaSize = 'Enter a valid area size';
  }
  if (values.details.length > 500) errors.details = 'Description must be 500 characters or fewer';
  return errors;
}

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = typeof params.id === 'string' ? params.id : '';
  const { accessToken, tenant, loading: authLoading } = useAuth();
  const tabParam = searchParams.get('tab');
  const initialTab: FormTab =
    tabParam === 'photos' || tabParam === 'documents' || tabParam === 'tags'
      ? tabParam
      : 'details';
  const [activeTab, setActiveTab] = useState<FormTab>(initialTab);
  const [property, setProperty] = useState<Property | null>(null);
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [values, setValues] = useState<PropertyFormValues | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyFormValues, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam === 'photos' || tabParam === 'documents' || tabParam === 'tags') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const load = useCallback(async () => {
    if (!accessToken || !propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProperty(accessToken, propertyId);
      setProperty(data.property);
      setPhotos(data.photos);
      setValues(propertyToFormValues(data.property));
      setTags(data.property.areaTags ?? []);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load property.'
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, propertyId]);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (!propertyId) {
      router.replace('/properties');
      return;
    }
    void load();
  }, [accessToken, authLoading, load, propertyId, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !values || !propertyId) return;

    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = { ...formValuesToPayload(values), areaTags: tags };
      const result = await updateProperty(accessToken, propertyId, payload);
      setProperty(result.property);
      setValues(propertyToFormValues(result.property));
      setTags(result.property.areaTags ?? []);
      setSuccess('Property saved.');
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not save property.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!accessToken) return;
    const confirmed = window.confirm(
      'Hide this property? It will no longer appear in your active listings or AI responses.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteProperty(accessToken, propertyId);
      router.push('/properties');
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not delete property.'
      );
    } finally {
      setDeleting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <PageShell>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-[var(--radius-xl)]" />
      </PageShell>
    );
  }

  if (!propertyId || !values) {
    return (
      <PageShell>
        <Alert variant="error">{error ?? 'Property not found.'}</Alert>
        <Link href="/properties" className="text-[13px] font-medium text-primary hover:underline">
          Back to properties
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link
        href="/properties"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to properties
      </Link>

      <div>
        <h1 className="text-heading-lg text-foreground">{property?.name}</h1>
        <p className="mt-1 text-[14px] text-muted">Edit property details, photos, and AI tags</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="sticky top-0 z-10 -mx-1 bg-background/95 py-2 backdrop-blur-sm">
        <TabRow
          items={FORM_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as FormTab)}
          className="max-w-3xl"
          noFade
        />
      </div>

      <Card padding="lg" className="max-w-3xl">
        <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-6">
          {activeTab === 'details' && (
            <PropertyForm
              values={values}
              onChange={setValues}
              country={tenant?.country}
              errors={errors}
            />
          )}

          {activeTab === 'photos' && accessToken && (
            <PropertyPhotosTab
              token={accessToken}
              propertyId={propertyId}
              photos={photos}
              onPhotosChange={setPhotos}
            />
          )}

          {activeTab === 'documents' && accessToken && (
            <PropertyDocumentsTab token={accessToken} propertyId={propertyId} />
          )}

          {activeTab === 'tags' && <PropertyTagsTab tags={tags} onChange={setTags} />}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
              <Link href="/properties">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="h-4 w-4" />
              Delete Property
            </Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
