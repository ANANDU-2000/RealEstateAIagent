import type { Metadata } from 'next';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

export const metadata: Metadata = {
  title: 'Welcome — PropAgent',
  description: 'Complete setup steps to start your WhatsApp AI agent.',
};

export default function OnboardingPage() {
  return <OnboardingChecklist />;
}
