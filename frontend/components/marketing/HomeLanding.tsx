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
    badge: 'Live',
    badgeClass: 'bg-success-light text-success',
    title: 'Chats',
    description:
      'See WhatsApp conversations, AI replies, and take over when you need to.',
    cta: 'Open chats',
  },
  {
    href: '/onboarding',
    icon: ClipboardList,
    badge: 'Setup',
    badgeClass: 'bg-warning-light text-warning',
    title: 'Onboarding',
    description:
      'Connect WhatsApp, add properties, and set up your AI agent before leads arrive.',
    cta: 'Continue setup',
  },
] as const;

export function HomeLanding() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MarketingHeader />

      <main id="solutions" className="relative flex-1">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_85%,rgba(37,99,235,0.07)_0%,transparent_55%)]"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-[1280px] gap-10 px-6 py-12 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-14 lg:px-10 lg:py-16">
          <section id="enterprise" className="flex flex-col gap-7">
            <span className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              India · UAE · Canada
            </span>

            <div className="flex flex-col gap-3">
              <h1 className="max-w-xl text-[36px] font-bold leading-[1.12] tracking-tight text-foreground lg:text-[42px]">
                Never miss a lead.
                <br />
                Never lose a deal.
              </h1>
              <p className="max-w-lg text-[15px] leading-relaxed text-muted">
                WhatsApp AI, CRM, and property tools in one place. Arjun qualifies leads,
                books visits, and flags hot deals while you close.
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
