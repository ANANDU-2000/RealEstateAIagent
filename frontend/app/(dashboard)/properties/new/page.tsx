'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  PropertyForm,
  emptyPropertyFormValues,
  formValuesToPayload,
  type PropertyFormValues,
} from '@/components/properties/PropertyForm';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { createProperty } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

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

export default function NewPropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { accessToken, tenant, loading: authLoading } = useAuth();
  const [values, setValues] = useState<PropertyFormValues>(() =>
    emptyPropertyFormValues(tenant?.country)
  );
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken, authLoading, router]);

  useEffect(() => {
    if (tenant?.country) {
      setValues((prev) => ({
        ...prev,
        currency: prev.currency || emptyPropertyFormValues(tenant.country).currency,
      }));
    }
  }, [tenant?.country]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !accessToken) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await createProperty(accessToken, formValuesToPayload(values));
      toast('Property created. Upload PDF brochures on the Documents tab for AI.');
      router.push(`/properties/${result.property.id}?tab=documents`);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not create property.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !accessToken) {
    return (
      <PageShell fill>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="flex-1 rounded-[var(--radius-2xl)]" />
      </PageShell>
    );
  }

  return (
    <PageShell fill className="max-w-3xl">
      <div className="shrink-0">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
        <h1 className="mt-3 text-heading-lg text-foreground">Add Property</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          After saving, open the property to add photos and PDF brochures for the AI agent.
        </p>
      </div>

      {error && (
        <Alert variant="error" className="shrink-0">
          {error}
        </Alert>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-2xl)] border border-border bg-surface p-5 shadow-[var(--shadow-lg)] md:p-6">
          <div className="dashboard-scroll min-h-0 flex-1 pr-1">
            <PropertyForm
              values={values}
              onChange={setValues}
              country={tenant?.country}
              errors={errors}
              variant="compact"
            />
          </div>

          <div className="mt-4 flex shrink-0 flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <Button type="submit" loading={submitting} size="md" className="min-w-[148px]">
              Create property
            </Button>
            <Link href="/properties">
              <Button type="button" variant="outline" size="md" className="min-w-[100px]">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </PageShell>
  );
}
