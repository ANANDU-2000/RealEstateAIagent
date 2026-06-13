'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Home, Search } from 'lucide-react';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import {
  LAND_PROPERTY_TYPES,
  listProperties,
  type Property,
  type PropertyListParams,
} from '@/lib/api';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'available' | 'sold' | 'land' | 'hidden';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'sold', label: 'Sold' },
  { id: 'land', label: 'Land' },
  { id: 'hidden', label: 'Hidden' },
];

type PropertyListProps = {
  token: string;
};

function filterProperties(properties: Property[], tab: FilterTab): Property[] {
  switch (tab) {
    case 'available':
      return properties.filter((p) => p.isAvailable && !p.isHidden);
    case 'sold':
      return properties.filter(
        (p) => !p.isAvailable && !p.isHidden && (p.status === 'sold' || p.status === 'rented')
      );
    case 'land':
      return properties.filter((p) => LAND_PROPERTY_TYPES.includes(p.propertyType));
    case 'hidden':
      return properties.filter((p) => p.isHidden || p.status === 'hidden');
    default:
      return properties.filter((p) => !p.isHidden);
  }
}

export function PropertyList({ token }: PropertyListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: PropertyListParams = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (activeTab === 'available') params.available = true;
      if (activeTab === 'sold') params.available = false;
      if (activeTab === 'hidden') params.includeHidden = true;

      const data = await listProperties(token, params);
      setProperties(data.properties);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load properties.'
      );
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch, activeTab]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => filterProperties(properties, activeTab),
    [properties, activeTab]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-surface-2 hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or area…"
            className="pl-9"
            aria-label="Search properties"
          />
        </div>
      </div>

      {error && (
        <Alert variant="error">
          {error}{' '}
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Retry
          </button>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <Spinner />
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Home}
          title={activeTab === 'hidden' ? 'No hidden properties' : 'No properties yet'}
          description={
            activeTab === 'hidden'
              ? 'Properties you mark as hidden appear here.'
              : debouncedSearch
                ? 'No properties match your search. Try different keywords.'
                : 'Add your first property to help Arjun match buyers.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
