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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { createProperty } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

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
      router.push(`/properties/${result.property.id}`);
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
      <div className="mx-auto flex w-full max-w-7xl animate-fade-in flex-col gap-7">
        <Skeleton className="mb-6 h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl animate-fade-in flex-col gap-7">
      <Link
        href="/properties"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to properties
      </Link>

      <h1 className="text-[22px] font-bold tracking-tight text-foreground">Add Property</h1>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Card padding="lg" className="max-w-3xl">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
          <PropertyForm
            values={values}
            onChange={setValues}
            country={tenant?.country}
            errors={errors}
          />

          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            <Button type="submit" loading={submitting}>
              Create Property
            </Button>
            <Link href="/properties">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
