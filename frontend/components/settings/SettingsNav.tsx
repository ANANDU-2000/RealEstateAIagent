'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TabRow, type TabRowItem } from '@/components/layout/TabRow';

const NAV_ITEMS = [
  { href: '/settings/whatsapp', label: 'WhatsApp', enabled: true },
  { href: '/settings/office', label: 'Office', enabled: true },
  { href: '/settings/ai', label: 'AI Agent', enabled: true },
  { href: '/settings/availability', label: 'Availability', enabled: true },
  { href: '/settings/profile', label: 'Profile', enabled: false },
  { href: '/settings/notifications', label: 'Notifications', enabled: false },
  { href: '/settings/billing', label: 'Billing', enabled: false },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  const tabItems: TabRowItem[] = NAV_ITEMS.map(({ href, label, enabled }) => ({
    id: href,
    label,
    href: enabled ? href : undefined,
    disabled: !enabled,
  }));

  const activeHref =
    NAV_ITEMS.find((item) => item.enabled && pathname === item.href)?.href ??
    '/settings/whatsapp';

  return (
    <TabRow items={tabItems} activeId={activeHref} variant="underline" className="w-full" />
  );
}
