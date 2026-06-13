import { SettingsNav } from '@/components/settings/SettingsNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl animate-fade-in flex-col gap-0 lg:flex-row lg:gap-8">
      <aside className="w-full shrink-0 lg:w-[200px]">
        <div className="mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Settings
          </h2>
        </div>
        <SettingsNav />
      </aside>
      <div className="min-w-0 flex-1 max-w-2xl">{children}</div>
    </div>
  );
}
