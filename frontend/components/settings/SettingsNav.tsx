'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  User,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/settings/whatsapp', label: 'WhatsApp', icon: MessageSquare, enabled: true },
  { href: '/settings/office', label: 'Office', icon: MapPin, enabled: true },
  { href: '/settings/ai', label: 'AI Agent', icon: Bot, enabled: true },
  { href: '/settings/availability', label: 'Availability', icon: Clock, enabled: true },
  { href: '/settings/profile', label: 'Profile', icon: User, enabled: false },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell, enabled: false },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard, enabled: false },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon, enabled }) => {
        const active = enabled && pathname === href;

        if (!enabled) {
          return (
            <span
              key={href}
              className="flex cursor-not-allowed items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-muted-light"
              title="Coming soon"
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">Soon</span>
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] transition-colors duration-100',
              active
                ? 'bg-primary/10 font-semibold text-primary'
                : 'text-muted hover:bg-surface-2 hover:text-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4', active && 'text-primary')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
