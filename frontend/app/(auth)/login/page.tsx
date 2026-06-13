import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In — PropAgent',
  description: 'Sign in to manage your leads, properties, and WhatsApp AI agent.',
};

export default function LoginPage() {
  return <LoginForm />;
}
