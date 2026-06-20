import Link from 'next/link';
import { Building2 } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer
      id="support"
      className="border-t border-border bg-primary-light/40"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-8 py-10 lg:flex-row lg:items-start lg:justify-between lg:px-12">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">PropAgent</span>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            © {new Date().getFullYear()} PropAgent. Built for brokers in India, UAE, and Canada.
            DPDP & CASL aware workflows.
          </p>
        </div>

        <div className="flex gap-16 text-sm">
          <ul className="flex flex-col gap-2 text-muted">
            <li>
              <Link href="/privacy" className="hover:text-foreground hover:underline">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/security" className="hover:text-foreground hover:underline">
                Security disclosure
              </Link>
            </li>
          </ul>
          <ul className="flex flex-col gap-2 text-muted">
            <li>
              <Link href="/terms" className="hover:text-foreground hover:underline">
                Terms of service
              </Link>
            </li>
            <li>
              <a href="mailto:support@propagent.in" className="hover:text-foreground hover:underline">
                Support center
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
