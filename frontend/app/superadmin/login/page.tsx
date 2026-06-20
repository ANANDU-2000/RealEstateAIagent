import type { Metadata } from 'next';
import SuperAdminLoginPage from './SuperAdminLoginClient';
import { APP_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Super Admin | ${APP_NAME}`,
  description: 'Platform administration for broker accounts and AI settings.',
};

export default function Page() {
  return <SuperAdminLoginPage />;
}
