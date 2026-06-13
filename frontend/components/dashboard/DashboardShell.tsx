'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart2,
  Bot,
  Building2,
  Calendar,
  Clock,
  Home,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  Settings,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { getConversationCounts } from '@/lib/api';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: 'unread' | 'overdue';
};

const MAIN_NAV: NavItem[] = [
  { href: '/chats', label: 'Chats', icon: MessageSquare, badge: 'unread' },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/properties', label: 'Properties', icon: Home },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/callbacks', label: 'Callbacks', icon: Phone, badge: 'overdue' },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
];

const SETTINGS_NAV: NavItem[] = [
  { href: '/settings/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/settings/office', label: 'Office', icon: MapPin },
  { href: '/settings/ai', label: 'AI Agent', icon: Bot },
  { href: '/settings/availability', label: 'Availability', icon: Clock },
];

const MOBILE_NAV: NavItem[] = [
  { href: '/chats', label: 'Chats', icon: MessageSquare, badge: 'unread' },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/properties', label: 'Properties', icon: Home },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function planLabel(plan?: string): string {
  if (!plan) return 'Trial';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function initials(name?: string): string {
  if (!name) return 'PA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function NavLink({
  item,
  active,
  counts,
  compact,
}: {
  item: NavItem;
  active: boolean;
  counts: { unreadCount: number; overdueCallbacks: number };
  compact?: boolean;
}) {
  const Icon = item.icon;
  const badgeCount =
    item.badge === 'unread'
      ? counts.unreadCount
      : item.badge === 'overdue'
        ? counts.overdueCallbacks
        : 0;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
        compact ? 'flex-col gap-1 px-2 py-2 text-[10px]' : '',
        active
          ? 'bg-white/10 font-medium text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <span className="relative">
        <Icon className={cn('h-4 w-4', compact && 'h-5 w-5')} />
        {badgeCount > 0 && compact && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </span>
      <span className={cn(compact && 'leading-none')}>{item.label}</span>
      {badgeCount > 0 && !compact && (
        <span
          className={cn(
            'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
            item.badge === 'overdue' ? 'bg-orange text-white' : 'bg-primary text-white'
          )}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant, accessToken, logout } = useAuth();
  const [counts, setCounts] = useState({ unreadCount: 0, overdueCallbacks: 0 });

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    async function poll() {
      try {
        const data = await getConversationCounts(accessToken!);
        if (!cancelled) {
          setCounts({
            unreadCount: data.unreadCount,
            overdueCallbacks: data.overdueCallbacks,
          });
        }
      } catch {
        // ignore polling errors
      }
    }

    void poll();
    const interval = setInterval(() => void poll(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accessToken]);

  function isActive(href: string): boolean {
    if (href === '/settings') return pathname.startsWith('/settings');
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-white lg:flex">
        <div className="border-b border-white/10 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{tenant?.businessName ?? 'PropAgent'}</p>
              <p className="truncate text-xs text-white/50">{tenant?.ownerName ?? 'Broker'}</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                counts={counts}
              />
            ))}
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Settings
            </p>
            <div className="flex flex-col gap-1">
              {SETTINGS_NAV.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  counts={counts}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              {initials(tenant?.ownerName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tenant?.ownerName ?? 'Broker'}</p>
              <Badge
                variant="primary"
                className="mt-1 border border-primary/30 bg-primary/20 text-[10px] normal-case text-white"
              >
                {planLabel(tenant?.plan)}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-surface px-1 py-1 lg:hidden">
          {MOBILE_NAV.map((item) => (
            <div key={item.href} className="flex flex-1 justify-center">
              <NavLink
                item={item}
                active={isActive(item.href)}
                counts={counts}
                compact
              />
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
