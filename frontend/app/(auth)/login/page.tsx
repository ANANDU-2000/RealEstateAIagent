import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { APP_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Sign in | ${APP_NAME}`,
  description: 'Sign in to manage leads, properties, and your WhatsApp AI agent.',
};

export default function LoginPage() {
  return <LoginForm />;
}
