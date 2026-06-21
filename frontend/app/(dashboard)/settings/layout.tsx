import { SettingsNav } from '@/components/settings/SettingsNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <div className="sticky top-0 z-20 -mx-[var(--dashboard-pad-x)] border-b border-border/70 bg-background/95 px-[var(--dashboard-pad-x)] py-3 backdrop-blur-md">
        <p className="mb-2 text-label text-muted">Settings</p>
        <SettingsNav />
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}
