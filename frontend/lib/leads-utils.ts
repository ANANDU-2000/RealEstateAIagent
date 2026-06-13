import type { Conversation, LeadStage } from '@/lib/api';

export type LeadColumnConfig = {
  stage: LeadStage;
  label: string;
  headerClass?: string;
  cardBorderClass?: string;
};

export const LEAD_COLUMNS: LeadColumnConfig[] = [
  { stage: 'new', label: 'New' },
  { stage: 'qualified', label: 'Qualified' },
  { stage: 'interested', label: 'Interested' },
  { stage: 'hot', label: 'Hot' },
  {
    stage: 'ultra_hot',
    label: 'Ultra Hot',
    headerClass: 'bg-orange-light text-orange border-orange/30',
    cardBorderClass: 'border-l-4 border-l-orange',
  },
  { stage: 'meeting_booked', label: 'Meeting Booked' },
  { stage: 'visited', label: 'Visited' },
  {
    stage: 'low_budget',
    label: 'Low Budget',
    headerClass: 'bg-warning-light text-warning border-warning/30',
    cardBorderClass: 'border-l-4 border-l-warning',
  },
  {
    stage: 'cold',
    label: 'Cold',
    headerClass: 'bg-surface-3 text-muted',
  },
  {
    stage: 'won',
    label: 'Won',
    headerClass: 'bg-success-light text-success border-success/30',
  },
  {
    stage: 'lost',
    label: 'Lost',
    headerClass: 'bg-danger-light text-danger border-danger/30',
  },
];

export function stageLabel(stage: LeadStage): string {
  return LEAD_COLUMNS.find((c) => c.stage === stage)?.label ?? stage.replace(/_/g, ' ');
}

export function groupByStage(conversations: Conversation[]): Record<LeadStage, Conversation[]> {
  const groups = Object.fromEntries(
    LEAD_COLUMNS.map((c) => [c.stage, [] as Conversation[]])
  ) as Record<LeadStage, Conversation[]>;

  for (const conv of conversations) {
    const stage = conv.leadStage;
    if (groups[stage]) {
      groups[stage].push(conv);
    } else {
      groups.new.push(conv);
    }
  }

  for (const stage of Object.keys(groups) as LeadStage[]) {
    groups[stage].sort((a, b) => b.leadScore - a.leadScore);
  }

  return groups;
}

export function formatPropertyTypeLabel(type: string): string {
  if (type === 'unknown') return 'Unknown';
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
