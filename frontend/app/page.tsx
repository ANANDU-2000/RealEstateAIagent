import Link from 'next/link';
import { Building2, ArrowRight, LogIn, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">PropAgent V3</p>
            <h1 className="text-2xl font-bold text-foreground">
              Never miss a lead. Never lose a deal.
            </h1>
          </div>
        </div>

        <p className="text-base leading-relaxed text-muted">
          WhatsApp AI agent, CRM, and property management for brokers in India, UAE, and
          Canada. Your PropAgent admin creates your account and shares your Client ID — then
          you sign in here.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="flex-1">
            <Button fullWidth size="lg">
              <LogIn className="h-4 w-4" />
              Broker sign in
            </Button>
          </Link>
          <Link href="/superadmin/login" className="flex-1">
            <Button variant="outline" fullWidth size="lg">
              <Shield className="h-4 w-4" />
              Super Admin
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/onboarding"
            className="group rounded-[var(--radius-2xl)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
          >
            <h2 className="font-semibold text-foreground">Onboarding</h2>
            <p className="mt-1 text-sm text-muted">Complete your setup checklist</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary group-hover:underline">
              Continue setup
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/chats"
            className="group rounded-[var(--radius-2xl)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
          >
            <h2 className="font-semibold text-foreground">Dashboard</h2>
            <p className="mt-1 text-sm text-muted">Live chats (sign in required)</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary group-hover:underline">
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <p className="text-xs text-muted">
          Public signup is disabled. Super Admin creates broker accounts at{' '}
          <Link href="/superadmin/clients" className="text-primary hover:underline">
            /superadmin/clients
          </Link>
          . Brokers sign in at{' '}
          <Link href="/login" className="text-primary hover:underline">/login</Link>.
        </p>
      </div>
    </main>
  );
}
