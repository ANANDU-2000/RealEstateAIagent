import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Briefcase,
  ClipboardList,
  LayoutGrid,
  Settings,
} from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { HomeBrokerAuthCard } from '@/components/marketing/HomeBrokerAuthCard';

const FEATURE_CARDS = [
  {
    href: '/chats',
    icon: LayoutGrid,
    badge: 'Live view',
    badgeClass: 'bg-success-light text-success',
    title: 'Dashboard',
    description:
      'Monitor live WhatsApp chats, human overrides, and AI replies in one three-panel workspace.',
    cta: 'Open dashboard',
  },
  {
    href: '/onboarding',
    icon: ClipboardList,
    badge: 'Setup',
    badgeClass: 'bg-warning-light text-warning',
    title: 'Onboarding',
    description:
      'Connect WhatsApp, add properties, and configure Arjun before your first lead arrives.',
    cta: 'Continue setup',
  },
] as const;

export function HomeLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

      <main
        id="solutions"
        className="relative flex-1 overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_85%,rgba(37,99,235,0.07)_0%,transparent_55%)]"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-[1280px] gap-12 px-8 py-14 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-16 lg:px-12 lg:py-20">
          <section id="enterprise" className="flex flex-col gap-8">
            <span className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Enterprise ready · V3
            </span>

            <div className="flex flex-col gap-4">
              <h1 className="max-w-xl text-[40px] font-bold leading-[1.1] tracking-tight text-foreground lg:text-[44px]">
                Never miss a lead.
                <br />
                Never lose a deal.
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted">
                WhatsApp AI agent, CRM, and precision property management for brokers in
                India, UAE, and Canada. Arjun qualifies leads, books visits, and hands off
                hot deals — while you close.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURE_CARDS.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex flex-col rounded-[var(--radius-2xl)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:border-primary/20 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
                      <card.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${card.badgeClass}`}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <h2 className="font-semibold text-foreground">{card.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {card.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                    {card.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-6 text-muted">
              <Award className="h-5 w-5" aria-hidden />
              <Briefcase className="h-5 w-5" aria-hidden />
              <Settings className="h-5 w-5" aria-hidden />
            </div>
          </section>

          <section className="flex justify-center lg:justify-end">
            <HomeBrokerAuthCard />
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
