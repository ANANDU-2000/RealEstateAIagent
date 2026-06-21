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
import { APP_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { WrongUrlBanner } from '@/components/dashboard/WrongUrlBanner';

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
        'relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium transition-colors duration-100',
        compact ? 'flex-col gap-1 px-2 py-2 text-[10px]' : '',
        active
          ? 'bg-white/10 text-white before:absolute before:bottom-1.5 before:left-0 before:top-1.5 before:w-0.5 before:rounded-r-full before:bg-primary'
          : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
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
        <Badge
          variant={item.badge === 'overdue' ? 'orange' : 'primary'}
          className="ml-auto h-[18px] min-w-[18px] justify-center px-1.5 py-0 text-[10px] normal-case"
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </Badge>
      )}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant, accessToken, logout } = useAuth();
  const [counts, setCounts] = useState({ unreadCount: 0, overdueCallbacks: 0 });
  const immersiveRoute = pathname === '/chats' || pathname.startsWith('/chats/');

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
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-[224px] shrink-0 flex-col bg-[#0D1117] text-white lg:flex">
        <div className="border-b border-white/[0.06] px-5 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white/90">
                {tenant?.businessName ?? APP_NAME}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-white/40">
                {tenant?.ownerName ?? 'Broker'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-8 overflow-y-auto px-3 py-5">
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
            <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
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

        <div className="border-t border-white/[0.06] px-3 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold">
              {initials(tenant?.ownerName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white/85">
                {tenant?.ownerName ?? 'Broker'}
              </p>
              <Badge variant="primary" className="mt-1 normal-case">
                {planLabel(tenant?.plan)}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] text-white/55 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-[var(--dashboard-pad-x)] pt-4 lg:pt-5">
            <WrongUrlBanner />
          </div>
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col px-[var(--dashboard-pad-x)] pb-[calc(var(--mobile-nav-h)+12px)] pt-3 lg:pb-[var(--dashboard-pad-y)]',
              immersiveRoute ? 'overflow-hidden' : 'dashboard-scroll'
            )}
          >
            {children}
          </div>
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border/80 bg-surface/95 px-1 backdrop-blur-md lg:hidden"
          style={{ height: 'var(--mobile-nav-h)', paddingTop: 6, paddingBottom: 6 }}
        >
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
