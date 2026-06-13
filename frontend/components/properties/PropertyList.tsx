'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Home, ListFilter, Search } from 'lucide-react';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import {
  LAND_PROPERTY_TYPES,
  PROPERTY_TYPE_OPTIONS,
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
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

  const filtered = useMemo(() => {
    let list = filterProperties(properties, activeTab);
    if (typeFilter !== 'all') {
      list = list.filter((p) => p.propertyType === typeFilter);
    }
    return list;
  }, [properties, activeTab, typeFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-[13px] text-foreground outline-none hover:border-border-dark focus:border-primary focus:shadow-[var(--focus-ring)]"
          aria-label="Filter by property type"
        >
          <option value="all">All types</option>
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as FilterTab)}
          className="h-9 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-[13px] text-foreground outline-none hover:border-border-dark focus:border-primary focus:shadow-[var(--focus-ring)]"
          aria-label="Filter by status"
        >
          {FILTER_TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or area…"
            className="pl-9"
            aria-label="Search properties"
          />
        </div>
        <button
          type="button"
          disabled
          title="Advanced filters coming soon"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-muted opacity-50"
          aria-label="Advanced filters"
        >
          <ListFilter className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 rounded-[var(--radius-lg)] border border-border bg-surface p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-surface shadow-[var(--shadow-xs)] font-semibold text-foreground'
                : 'text-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
