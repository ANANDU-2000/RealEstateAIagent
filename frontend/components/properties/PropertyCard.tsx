'use client';

import Link from 'next/link';
import { MapPin, Home } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  formatPropertyPrice,
  propertyStatusLabel,
  propertyStatusVariant,
  type Property,
} from '@/lib/api';
import { cn } from '@/lib/utils';

type PropertyCardProps = {
  property: Property;
  className?: string;
};

export function PropertyCard({ property, className }: PropertyCardProps) {
  const thumbnail = property.photoUrls[0];
  const statusLabel = propertyStatusLabel(property.status, property.isHidden);
  const statusVariant = propertyStatusVariant(property.status, property.isHidden);

  return (
    <Link href={`/properties/${property.id}`} className={cn('group block', className)}>
      <Card
        padding="sm"
        className="h-full overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]"
      >
        <div className="mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-surface-2">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={property.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <Home className="h-10 w-10 text-muted" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{property.name}</h3>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>

          <p className="flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {property.location}, {property.city}
            </span>
          </p>

          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-bold text-primary">
              {formatPropertyPrice(property.price, property.currency)}
              {property.listingType === 'rent' && (
                <span className="text-xs font-normal text-muted"> /mo</span>
              )}
            </p>
            {property.enquiryCount > 0 && (
              <span className="text-[11px] text-muted">
                {property.enquiryCount} {property.enquiryCount === 1 ? 'enquiry' : 'enquiries'}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
