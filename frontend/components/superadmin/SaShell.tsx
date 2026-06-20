'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, LayoutDashboard, LogOut, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSaAuth } from '@/hooks/useSaAuth';
import { APP_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/superadmin/clients', label: 'Clients', icon: Users, exact: false },
  { href: '/superadmin/prompt', label: 'Prompt', icon: FileText, exact: false },
] as const;

export function SaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, logout } = useSaAuth();
  const isLoginPage = pathname === '/superadmin/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-[#0F172A]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#E2E8F0]">
      {token && (
        <header className="border-b border-[#334155] bg-[#0F172A]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold text-white">{APP_NAME} Super Admin</span>
            </div>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ href, label, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-[#1E293B] text-white'
                        : 'text-[#94A3B8] hover:bg-[#1E293B]/60 hover:text-white'
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <Button
              size="sm"
              variant="ghost"
              className="text-[#94A3B8] hover:text-white"
              onClick={() => {
                logout();
                router.push('/superadmin/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
