import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/lib/brand';

const NAV_LINKS = [
  { label: 'Solutions', href: '#solutions' },
  { label: 'Enterprise', href: '#enterprise' },
  { label: 'Support', href: '#support' },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link href="/signup">
          <Button size="sm" className="bg-sidebar hover:bg-sidebar-2 shadow-none">
            Request demo
          </Button>
        </Link>
      </div>
    </header>
  );
}
