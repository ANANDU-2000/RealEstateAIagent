import type { Metadata } from 'next';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { APP_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Welcome | ${APP_NAME}`,
  description: 'Complete setup to start your WhatsApp AI agent.',
};

export default function OnboardingPage() {
  return <OnboardingChecklist />;
}
