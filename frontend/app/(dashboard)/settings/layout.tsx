import { SettingsNav } from '@/components/settings/SettingsNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-[calc(100vh-7rem)] animate-fade-in flex-col gap-6 lg:flex-row lg:gap-10">
      <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[220px] lg:self-start">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
          Settings
        </h2>
        <SettingsNav />
      </aside>
      <div className="min-w-0 flex-1 lg:max-w-2xl">{children}</div>
    </div>
  );
}
