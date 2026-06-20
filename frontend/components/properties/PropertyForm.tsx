'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  currencyForCountry,
  LAND_PROPERTY_TYPES,
  LAND_TYPE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  type Property,
  type PropertyCreatePayload,
  type PropertyStatus,
  type PropertyType,
} from '@/lib/api';
import { cn } from '@/lib/utils';

export type PropertyFormValues = {
  name: string;
  propertyType: PropertyType;
  listingType: 'sale' | 'rent';
  areaSize: string;
  areaUnit: PropertyCreatePayload['areaUnit'];
  price: string;
  currency: PropertyCreatePayload['currency'];
  city: string;
  location: string;
  details: string;
  status: PropertyStatus;
  landType: string;
};

type PropertyFormProps = {
  values: PropertyFormValues;
  onChange: (values: PropertyFormValues) => void;
  country?: string;
  errors?: Partial<Record<keyof PropertyFormValues, string>>;
  variant?: 'default' | 'compact';
};

const COMPACT_FIELD =
  'h-9 rounded-[var(--radius-md)] border-border/90 bg-surface shadow-[var(--shadow-xs)]';

const COMPACT_LABEL = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-muted';

export function emptyPropertyFormValues(country?: string): PropertyFormValues {
  return {
    name: '',
    propertyType: 'apartment',
    listingType: 'sale',
    areaSize: '',
    areaUnit: 'sqft',
    price: '',
    currency: currencyForCountry(country),
    city: '',
    location: '',
    details: '',
    status: 'available',
    landType: '',
  };
}

export function propertyToFormValues(property: Property): PropertyFormValues {
  return {
    name: property.name,
    propertyType: property.propertyType,
    listingType: property.listingType,
    areaSize: property.areaSize != null ? String(property.areaSize) : '',
    areaUnit: property.areaUnit,
    price: String(property.price),
    currency: property.currency,
    city: property.city,
    location: property.location,
    details: property.details ?? '',
    status:
      property.isHidden || property.status === 'hidden'
        ? 'hidden'
        : property.status === 'sold' || property.status === 'rented'
          ? 'sold'
          : 'available',
    landType: property.landType ?? '',
  };
}

export function formValuesToPayload(values: PropertyFormValues): PropertyCreatePayload {
  const payload: PropertyCreatePayload = {
    name: values.name.trim(),
    propertyType: values.propertyType,
    listingType: values.listingType,
    price: Number(values.price),
    currency: values.currency,
    city: values.city.trim(),
    location: values.location.trim(),
    areaUnit: values.areaUnit,
    status: values.status,
  };

  if (values.areaSize.trim()) {
    payload.areaSize = Number(values.areaSize);
  }
  if (values.details.trim()) {
    payload.details = values.details.trim();
  }
  if (LAND_PROPERTY_TYPES.includes(values.propertyType) && values.landType) {
    payload.landType = values.landType;
  }

  return payload;
}

function compactLabelProps(label: string, required?: boolean) {
  return {
    label: required ? `${label} *` : label,
    className: COMPACT_FIELD,
    labelClassName: COMPACT_LABEL,
  } as const;
}

export function PropertyForm({
  values,
  onChange,
  country,
  errors = {},
  variant = 'default',
}: PropertyFormProps) {
  const compact = variant === 'compact';
  const showLandType = LAND_PROPERTY_TYPES.includes(values.propertyType);
  const detailsLength = values.details.length;

  function update<K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  if (compact) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          {...compactLabelProps('Property name', true)}
          placeholder="E.g. Skyline Apartments"
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
        />

        <Select
          {...compactLabelProps('Property type', true)}
          value={values.propertyType}
          onChange={(e) => update('propertyType', e.target.value as PropertyType)}
          options={PROPERTY_TYPE_OPTIONS}
          error={errors.propertyType}
          className={COMPACT_FIELD}
          labelClassName={COMPACT_LABEL}
        />

        <Select
          {...compactLabelProps('Listing type')}
          value={values.listingType}
          onChange={(e) => update('listingType', e.target.value as 'sale' | 'rent')}
          options={[
            { value: 'sale', label: 'For Sale' },
            { value: 'rent', label: 'For Rent' },
          ]}
          className={COMPACT_FIELD}
          labelClassName={COMPACT_LABEL}
        />

        <Input
          {...compactLabelProps('Area size')}
          type="number"
          min="0"
          step="any"
          placeholder="0.00"
          value={values.areaSize}
          onChange={(e) => update('areaSize', e.target.value)}
          error={errors.areaSize}
        />

        <Select
          {...compactLabelProps('Area unit')}
          value={values.areaUnit ?? 'sqft'}
          onChange={(e) =>
            update('areaUnit', e.target.value as PropertyCreatePayload['areaUnit'])
          }
          options={[
            { value: 'sqft', label: 'Sq ft' },
            { value: 'sqyards', label: 'Sq yards' },
            { value: 'acres', label: 'Acres' },
            { value: 'kanal', label: 'Kanal' },
            { value: 'bigha', label: 'Bigha' },
            { value: 'marla', label: 'Marla' },
          ]}
          className={COMPACT_FIELD}
          labelClassName={COMPACT_LABEL}
        />

        <Input
          {...compactLabelProps('Price', true)}
          type="number"
          min="1"
          step="1"
          placeholder="Enter amount"
          value={values.price}
          onChange={(e) => update('price', e.target.value)}
          error={errors.price}
        />

        <Select
          {...compactLabelProps('Currency')}
          value={values.currency ?? currencyForCountry(country)}
          onChange={(e) =>
            update('currency', e.target.value as PropertyCreatePayload['currency'])
          }
          options={[
            { value: 'INR', label: 'INR (₹)' },
            { value: 'AED', label: 'AED' },
            { value: 'CAD', label: 'CAD' },
          ]}
          className={COMPACT_FIELD}
          labelClassName={COMPACT_LABEL}
        />

        <Input
          {...compactLabelProps('City', true)}
          placeholder="E.g. Mumbai"
          value={values.city}
          onChange={(e) => update('city', e.target.value)}
          error={errors.city}
        />

        <Input
          {...compactLabelProps('Locality / area / sector', true)}
          placeholder="Sector 70, Bandra West…"
          value={values.location}
          onChange={(e) => update('location', e.target.value)}
          error={errors.location}
          hint="Used by AI to match buyer location preferences"
          className={cn(COMPACT_FIELD, 'md:col-span-2')}
          labelClassName={COMPACT_LABEL}
        />

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="property-details" className={COMPACT_LABEL}>
            Description
          </label>
          <textarea
            id="property-details"
            value={values.details}
            onChange={(e) => {
              if (e.target.value.length <= 500) update('details', e.target.value);
            }}
            rows={2}
            maxLength={500}
            placeholder="Key highlights buyers should know…"
            className={cn(
              'min-h-[56px] w-full resize-none rounded-[var(--radius-md)] border border-border/90 bg-surface px-3 py-2 text-sm text-foreground shadow-[var(--shadow-xs)]',
              'placeholder:text-muted-light outline-none transition-all duration-150',
              'hover:border-border-dark focus:border-primary focus:shadow-[var(--focus-ring)]',
              errors.details && 'border-danger focus:border-danger focus:shadow-[var(--error-ring)]'
            )}
          />
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span className="italic">AI uses these details + area to match with customers</span>
            <span className="tabular-nums">{detailsLength}/500</span>
          </div>
          {errors.details && <p className="text-xs text-danger">{errors.details}</p>}
        </div>

        <Select
          {...compactLabelProps('Status')}
          value={values.status}
          onChange={(e) => update('status', e.target.value as PropertyStatus)}
          options={[
            { value: 'available', label: 'Available' },
            { value: 'sold', label: 'Sold' },
            { value: 'hidden', label: 'Hidden' },
          ]}
          className={COMPACT_FIELD}
          labelClassName={COMPACT_LABEL}
        />

        {showLandType && (
          <Select
            {...compactLabelProps('Land type')}
            value={values.landType}
            onChange={(e) => update('landType', e.target.value)}
            options={[{ value: '', label: 'Select land type' }, ...LAND_TYPE_OPTIONS]}
            error={errors.landType}
            className={COMPACT_FIELD}
            labelClassName={COMPACT_LABEL}
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Input
        label="Property Name *"
        value={values.name}
        onChange={(e) => update('name', e.target.value)}
        error={errors.name}
        className="md:col-span-2"
      />

      <Select
        label="Property Type *"
        value={values.propertyType}
        onChange={(e) => update('propertyType', e.target.value as PropertyType)}
        options={PROPERTY_TYPE_OPTIONS}
        error={errors.propertyType}
      />

      <Select
        label="Listing Type"
        value={values.listingType}
        onChange={(e) => update('listingType', e.target.value as 'sale' | 'rent')}
        options={[
          { value: 'sale', label: 'For Sale' },
          { value: 'rent', label: 'For Rent' },
        ]}
      />

      <Input
        label="Area Size"
        type="number"
        min="0"
        step="any"
        value={values.areaSize}
        onChange={(e) => update('areaSize', e.target.value)}
        error={errors.areaSize}
      />

      <Select
        label="Area Unit"
        value={values.areaUnit ?? 'sqft'}
        onChange={(e) =>
          update('areaUnit', e.target.value as PropertyCreatePayload['areaUnit'])
        }
        options={[
          { value: 'sqft', label: 'Sq ft' },
          { value: 'sqyards', label: 'Sq yards' },
          { value: 'acres', label: 'Acres' },
          { value: 'kanal', label: 'Kanal' },
          { value: 'bigha', label: 'Bigha' },
          { value: 'marla', label: 'Marla' },
        ]}
      />

      <Input
        label="Price *"
        type="number"
        min="1"
        step="1"
        value={values.price}
        onChange={(e) => update('price', e.target.value)}
        error={errors.price}
      />

      <Select
        label="Currency"
        value={values.currency ?? currencyForCountry(country)}
        onChange={(e) =>
          update('currency', e.target.value as PropertyCreatePayload['currency'])
        }
        options={[
          { value: 'INR', label: 'INR (₹)' },
          { value: 'AED', label: 'AED' },
          { value: 'CAD', label: 'CAD' },
        ]}
      />

      <Input
        label="City *"
        value={values.city}
        onChange={(e) => update('city', e.target.value)}
        error={errors.city}
      />

      <Input
        label="Locality / Area / Sector *"
        value={values.location}
        onChange={(e) => update('location', e.target.value)}
        error={errors.location}
        hint="Used by AI to match buyer location preferences"
      />

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label htmlFor="property-details-default" className="text-[13px] font-medium text-foreground leading-none">
          Description
        </label>
        <textarea
          id="property-details-default"
          value={values.details}
          onChange={(e) => {
            if (e.target.value.length <= 500) update('details', e.target.value);
          }}
          rows={4}
          maxLength={500}
          placeholder="Key highlights buyers should know…"
          className={cn(
            'min-h-[80px] w-full rounded-[var(--radius-lg)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground',
            'placeholder:text-muted-light outline-none transition-all duration-150',
            'hover:border-border-dark focus:border-primary focus:shadow-[var(--focus-ring)]',
            errors.details && 'border-danger focus:border-danger focus:shadow-[var(--error-ring)]'
          )}
        />
        <div className="flex items-center justify-between text-xs text-muted">
          <span>AI uses these details + area to match with customers</span>
          <span>{detailsLength}/500</span>
        </div>
        {errors.details && <p className="text-xs text-danger">{errors.details}</p>}
      </div>

      <Select
        label="Status"
        value={values.status}
        onChange={(e) => update('status', e.target.value as PropertyStatus)}
        options={[
          { value: 'available', label: 'Available' },
          { value: 'sold', label: 'Sold' },
          { value: 'hidden', label: 'Hidden' },
        ]}
      />

      {showLandType && (
        <Select
          label="Land Type"
          value={values.landType}
          onChange={(e) => update('landType', e.target.value)}
          options={[{ value: '', label: 'Select land type' }, ...LAND_TYPE_OPTIONS]}
          error={errors.landType}
        />
      )}
    </div>
  );
}
