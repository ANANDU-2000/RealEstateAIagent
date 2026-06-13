import { SettingsNav } from '@/components/settings/SettingsNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:gap-12">
      <aside className="w-full shrink-0 lg:w-52">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted">Manage your workspace preferences</p>
        </div>
        <SettingsNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
