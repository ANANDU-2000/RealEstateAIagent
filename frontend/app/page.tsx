import { Building2, CheckCircle2, Server } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">PropAgent V3</p>
            <h1 className="text-2xl font-bold text-foreground">Foundation Ready</h1>
          </div>
        </div>

        <p className="text-base leading-relaxed text-muted">
          Stage 1 infrastructure is wired. Backend API, Render PostgreSQL, and frontend
          scaffold are in place. Feature pages ship in Stage 2.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatusCard
            icon={<Server className="h-5 w-5 text-primary" />}
            title="Backend API"
            detail={process.env.NEXT_PUBLIC_API_URL ?? 'Not configured'}
          />
          <StatusCard
            icon={<CheckCircle2 className="h-5 w-5 text-success" />}
            title="Frontend"
            detail="Next.js + Tailwind design tokens"
          />
        </div>
      </div>
    </main>
  );
}

function StatusCard({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3">{icon}</div>
      <h2 className="font-semibold text-foreground">{title}</h2>
      <p className="mt-1 break-all text-sm text-muted">{detail}</p>
    </div>
  );
}
