import { SettingsNav } from '@/components/settings/SettingsNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="sticky top-0 z-20 -mx-[var(--dashboard-pad-x)] border-b border-border/70 bg-background/95 px-[var(--dashboard-pad-x)] py-3 backdrop-blur-md lg:hidden">
        <p className="mb-2 text-label text-muted">Settings</p>
        <SettingsNav mobileOnly />
      </div>

      <div className="flex flex-col gap-6 pb-10 pt-4 lg:flex-row lg:items-start lg:gap-8 lg:pt-2">
        <aside className="hidden w-[220px] shrink-0 lg:block lg:sticky lg:top-2">
          <p className="mb-3 text-label text-muted">Settings</p>
          <SettingsNav desktopOnly />
        </aside>
        <div className="min-w-0 flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
