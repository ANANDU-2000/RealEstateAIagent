import Link from 'next/link';
import { Building2, MessageSquare, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 flex-col bg-sidebar p-4 text-white lg:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold">PropAgent</span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/chats"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            <MessageSquare className="h-4 w-4" />
            Chats
          </Link>
          <Link
            href="/settings/office"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
