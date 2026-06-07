import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const CHECKLIST = [
  { label: 'Connect WhatsApp Business', href: '/settings/office', done: false },
  { label: 'Add your first property', href: '/properties/new', done: false },
  { label: 'Set office hours', href: '/settings/availability', done: false },
  { label: 'Configure AI personality', href: '/settings/ai', done: false },
];

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-2 pt-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome to PropAgent</h1>
        <p className="text-muted">
          Complete these steps to start receiving and responding to leads on WhatsApp.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        {CHECKLIST.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2
                className={`h-5 w-5 ${item.done ? 'text-success' : 'text-border'}`}
              />
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
            <Link href={item.href}>
              <Button variant="ghost" size="sm">
                Set up
              </Button>
            </Link>
          </div>
        ))}
      </Card>

      <Link href="/chats">
        <Button fullWidth>Go to dashboard</Button>
      </Link>
    </div>
  );
}
