import { SettingsNav } from '@/components/settings/SettingsNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="sticky top-0 z-20 -mx-[var(--dashboard-pad-x)] border-b border-border/70 bg-background/95 px-[var(--dashboard-pad-x)] py-3 backdrop-blur-md">
        <SettingsNav />
      </div>
      <div className="w-full pt-4">{children}</div>
    </div>
  );
}
