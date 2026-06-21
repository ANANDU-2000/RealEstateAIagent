'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  Flame,
  MessageSquare,
  PhoneCall,
  Snowflake,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { PageShell } from '@/components/layout/PageShell';
import { TabRow } from '@/components/layout/TabRow';
import { useAuth } from '@/hooks/useAuth';
import {
  type AnalyticsData,
  type AnalyticsRange,
  type ApiError,
  getAnalytics,
} from '@/lib/api';
import { formatPropertyTypeLabel } from '@/lib/leads-utils';
import { cn } from '@/lib/utils';

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

const DONUT_COLORS = [
  '#2563EB',
  '#F97316',
  '#10B981',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
  '#EAB308',
  '#14B8A6',
];

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    return (err as ApiError).error;
  }
  return 'Something went wrong';
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[12px] font-semibold',
        up ? 'text-success' : 'text-danger'
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function StatCard({
  title,
  value,
  sub,
  change,
  icon: Icon,
  accentClass,
}: {
  title: string;
  value: string | number;
  sub?: string;
  change?: number | null;
  icon: React.ElementType;
  accentClass?: string;
}) {
  return (
    <Card padding="sm" className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</span>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-muted text-primary',
            accentClass
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-[28px] font-bold leading-none text-foreground">{value}</span>
        {change !== undefined && <ChangeBadge value={change} />}
      </div>
      {sub && <p className="text-[12px] text-muted">{sub}</p>}
    </Card>
  );
}

function LeadsBarChart({ data, range }: { data: AnalyticsData['leadsPerDay']; range: number }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const map = new Map(data.map((d) => [d.date, d.count]));
    const points: { date: string; count: number; label: string }[] = [];
    const today = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      points.push({
        date: key,
        count: map.get(key) ?? 0,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      });
    }
    return points;
  }, [data, range]);

  const max = Math.max(1, ...chartData.map((d) => d.count));
  const width = 560;
  const height = 220;
  const pad = { top: 16, right: 8, bottom: 32, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const barGap = 2;
  const barW = Math.max(4, (innerW - barGap * (chartData.length - 1)) / chartData.length);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[320px]" role="img">
        <title>Leads per day</title>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = pad.top + innerH * (1 - pct);
          return (
            <g key={pct}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" className="fill-muted text-[9px]">
                {Math.round(max * pct)}
              </text>
            </g>
          );
        })}
        {chartData.map((d, i) => {
          const barH = (d.count / max) * innerH;
          const x = pad.left + i * (barW + barGap);
          const y = pad.top + innerH - barH;
          const showLabel = chartData.length <= 14 || i % Math.ceil(chartData.length / 7) === 0;
          return (
            <g
              key={d.date}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, d.count > 0 ? 2 : 0)}
                rx={4}
                className={cn(
                  'fill-primary transition-opacity',
                  hovered !== null && hovered !== i && 'opacity-30'
                )}
              />
              {showLabel && (
                <text
                  x={x + barW / 2}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-muted text-[8px]"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hovered !== null && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-[var(--radius-md)] border border-border bg-surface px-2 py-1 text-xs shadow-[var(--shadow-md)]">
          <span className="font-semibold">{chartData[hovered].label}</span>
          <span className="text-muted"> · {chartData[hovered].count} leads</span>
        </div>
      )}
    </div>
  );
}

function LeadsDonutChart({ data }: { data: AnalyticsData['leadsByPropertyType'] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const cx = 100;
  const cy = 100;
  const r = 70;
  const ir = 42;

  let angle = -Math.PI / 2;
  const segments = data.map((item, i) => {
    const slice = (item.count / total) * Math.PI * 2;
    const start = angle;
    angle += slice;
    const end = angle;
    const large = slice > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const ix1 = cx + ir * Math.cos(end);
    const iy1 = cy + ir * Math.sin(end);
    const ix2 = cx + ir * Math.cos(start);
    const iy2 = cy + ir * Math.sin(start);
    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${ir} ${ir} 0 ${large} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');
    return { ...item, path, color: DONUT_COLORS[i % DONUT_COLORS.length], pct: (item.count / total) * 100 };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative shrink-0">
        <svg viewBox="0 0 200 200" className="h-48 w-48" role="img">
          <title>Leads by property type</title>
          {segments.length === 0 ? (
            <circle cx={cx} cy={cy} r={r} className="fill-surface-3" />
          ) : (
            segments.map((seg, i) => (
              <path
                key={seg.propertyType}
                d={seg.path}
                fill={seg.color}
                className={cn(
                  'transition-opacity',
                  hovered !== null && hovered !== i && 'opacity-40'
                )}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))
          )}
          <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground text-lg font-bold">
            {total}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted text-[10px]">
            total leads
          </text>
        </svg>
        {hovered !== null && segments[hovered] && (
          <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-[var(--radius-md)] border border-border bg-surface px-2 py-1 text-xs shadow-[var(--shadow-md)]">
            {formatPropertyTypeLabel(segments[hovered].propertyType)} · {segments[hovered].count} (
            {segments[hovered].pct.toFixed(0)}%)
          </div>
        )}
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {segments.map((seg, i) => (
          <li key={seg.propertyType} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="flex-1 text-foreground">
              {formatPropertyTypeLabel(seg.propertyType)}
            </span>
            <span className="font-semibold text-muted">{seg.count}</span>
          </li>
        ))}
        {segments.length === 0 && (
          <li className="text-sm text-muted">No lead type data for this period.</li>
        )}
      </ul>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { accessToken, loading: authLoading } = useAuth();

  const [range, setRange] = useState<AnalyticsRange>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAnalytics(accessToken, range);
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, range]);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    void loadAnalytics();
  }, [accessToken, authLoading, router, loadAnalytics]);

  const aiPct = data
    ? data.aiMessageLimit > 0
      ? Math.min(100, (data.aiMessagesUsed / data.aiMessageLimit) * 100)
      : 0
    : 0;

  if (authLoading || !accessToken) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <PageShell
      title="Analytics"
      description="Lead pipeline, property performance, and AI usage for your brokerage."
      actions={
        <TabRow
          activeId={String(range)}
          onChange={(id) => setRange(Number(id) as AnalyticsRange)}
          className="w-full sm:w-auto"
          items={RANGE_OPTIONS.map((opt) => ({
            id: String(opt.value),
            label: opt.label,
          }))}
        />
      }
    >

      {error && (
        <Alert variant="error">
          {error}{' '}
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => void loadAnalytics()}>
            Retry
          </Button>
        </Alert>
      )}

      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Leads"
              value={data.totalLeads}
              change={data.totalLeadsChange}
              icon={Users}
              accentClass="bg-primary-muted text-primary"
            />
            <StatCard
              title="Visits Booked"
              value={data.meetingsBooked}
              change={data.meetingsBookedChange}
              icon={CalendarCheck}
              accentClass="bg-success-light text-success"
            />
            <StatCard
              title="Ultra Hot"
              value={data.ultraHotLeads}
              icon={Zap}
              accentClass="bg-orange-light text-orange"
            />
            <StatCard
              title="AI Messages"
              value={`${data.aiMessagesUsed} / ${data.aiMessageLimit}`}
              sub={
                data.daysUntilReset != null
                  ? `${data.daysUntilReset} days until reset`
                  : undefined
              }
              icon={MessageSquare}
              accentClass="bg-purple-light text-purple"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Callbacks"
              value={`${data.callbacksDone} done`}
              sub={`${data.callbacksPending} pending`}
              icon={PhoneCall}
              accentClass="bg-warning-light text-warning"
            />
            <StatCard title="Cold Leads" value={data.coldLeads} icon={Snowflake} accentClass="bg-surface-3 text-muted" />
            <StatCard
              title="Low Budget"
              value={data.lowBudgetEscalations}
              sub="escalations"
              icon={Flame}
              accentClass="bg-danger-light text-danger"
            />
            <StatCard
              title="Conversion Rate"
              value={`${data.conversionRate}%`}
              sub="leads → visit booked"
              icon={TrendingUp}
              accentClass="bg-success-light text-success"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-5 text-[13px] font-semibold text-foreground">Leads per day</h2>
              <LeadsBarChart data={data.leadsPerDay} range={range} />
            </Card>
            <Card>
              <h2 className="mb-5 text-[13px] font-semibold text-foreground">Leads by property type</h2>
              <LeadsDonutChart data={data.leadsByPropertyType} />
            </Card>
          </div>

          <Card padding="sm" className="overflow-x-auto">
            <h2 className="mb-4 px-2 text-sm font-semibold text-foreground">
              Property performance
            </h2>
            <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="border-b border-border/60 text-muted">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]">Property</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]">Enquiries</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]">Visits</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.propertyPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-muted">
                      No property data yet. Add listings to track performance.
                    </td>
                  </tr>
                ) : (
                  data.propertyPerformance.map((row) => (
                    <tr key={row.id} className="border-b border-border/60 transition-colors duration-100 hover:bg-surface-2">
                      <td className="px-4 py-3.5 text-[13px] font-medium">{row.name}</td>
                      <td className="px-4 py-3.5 text-[13px]">{row.enquiries}</td>
                      <td className="px-4 py-3.5 text-[13px]">{row.visits}</td>
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-primary">
                        {row.conversionRate}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-foreground">AI usage this month</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted">
                    {data.aiMessagesUsed} of {data.aiMessageLimit} messages used
                  </span>
                  <span className="font-semibold text-foreground">{Math.round(aiPct)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500 ease-out',
                      aiPct >= 90 ? 'bg-danger' : aiPct >= 70 ? 'bg-warning' : 'bg-primary'
                    )}
                    style={{ width: `${aiPct}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-8 text-[13px]">
                <div>
                  <span className="text-muted">Est. cost ({range}d)</span>
                  <p className="font-semibold text-foreground">
                    ${data.aiCostEstimate.toFixed(2)} USD
                  </p>
                </div>
                <div>
                  <span className="text-muted">Hot leads</span>
                  <p className="font-semibold text-foreground">{data.hotLeads}</p>
                </div>
                {data.daysUntilReset != null && (
                  <div>
                    <span className="text-muted">Reset in</span>
                    <p className="font-semibold text-foreground">{data.daysUntilReset} days</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
}
