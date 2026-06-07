import type { Metadata } from 'next';
import { SignupWizard } from '@/components/auth/SignupWizard';

export const metadata: Metadata = {
  title: 'Start Free Trial — PropAgent',
  description: 'Create your PropAgent account and start your 14-day free trial.',
};

export default function SignupPage() {
  return <SignupWizard />;
}
