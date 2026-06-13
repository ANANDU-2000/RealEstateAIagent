import type { Metadata } from 'next';
import SuperAdminLoginPage from './SuperAdminLoginClient';

export const metadata: Metadata = {
  title: 'Super Admin Sign In — PropAgent',
  description: 'PropAgent platform administration for broker accounts and AI settings.',
};

export default function Page() {
  return <SuperAdminLoginPage />;
}
