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
  const photoCount = property.photoUrls.length;

  return (
    <Link href={`/properties/${property.id}`} className={cn('group block', className)}>
      <Card
        padding="none"
        className="h-full overflow-hidden transition-all duration-200 hover:border-border-dark hover:shadow-[var(--shadow-md)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={property.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Home className="h-10 w-10 text-muted" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          {property.enquiryCount > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {property.enquiryCount} {property.enquiryCount === 1 ? 'enquiry' : 'enquiries'}
            </span>
          )}
          {photoCount > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {photoCount} photos
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2.5 p-4">
          <h3 className="line-clamp-1 text-[14px] font-semibold leading-snug text-foreground">
            {property.name}
          </h3>

          <p className="flex items-center gap-1 text-[12px] text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {property.location}, {property.city}
            </span>
          </p>

          <div className="mt-0.5 flex items-end justify-between gap-2">
            <p className="text-[17px] font-bold leading-none text-primary">
              {formatPropertyPrice(property.price, property.currency)}
              {property.listingType === 'rent' && (
                <span className="text-[11px] font-normal text-muted"> /mo</span>
              )}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
