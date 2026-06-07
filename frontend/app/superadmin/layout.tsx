import { SaAuthProvider } from '@/hooks/useSaAuth';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SaAuthProvider>
      <div className="min-h-screen bg-[#0F172A] text-[#E2E8F0]">{children}</div>
    </SaAuthProvider>
  );
}
