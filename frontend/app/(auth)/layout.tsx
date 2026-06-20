import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-10">
        {children}
      </div>
    </div>
  );
}
