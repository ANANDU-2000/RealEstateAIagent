import { SaAuthProvider } from '@/hooks/useSaAuth';
import { SaShell } from '@/components/superadmin/SaShell';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SaAuthProvider>
      <SaShell>{children}</SaShell>
    </SaAuthProvider>
  );
}
