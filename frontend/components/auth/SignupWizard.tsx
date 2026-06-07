'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  COUNTRIES,
  PLANS,
  TRIAL_DAYS,
  formatPrice,
  type Country,
  type PlanId,
} from '@/lib/constants';
import {
  passwordStrength,
  signupStep1Schema,
  signupStep3Schema,
  type SignupStep1Data,
} from '@/lib/validation/auth';
import { useAuth } from '@/hooks/useAuth';

type BillingCycle = 'monthly' | 'annual';

const STEPS = ['Account', 'Plan', 'Confirm'];

export function SignupWizard() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  const [form, setForm] = useState<SignupStep1Data>({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    country: 'IN',
  });
  const [plan, setPlan] = useState<PlanId>('pro');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [caslConsent, setCaslConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = passwordStrength(form.password);
  const currency = COUNTRIES.find((c) => c.code === form.country)?.currency ?? 'INR';

  function updateForm(patch: Partial<SignupStep1Data>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleStep1Continue() {
    const parsed = signupStep1Schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setStep(1);
  }

  async function handleCreateAccount() {
    const parsed = signupStep3Schema.safeParse({
      termsAccepted,
      caslConsent,
      country: form.country,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await register({
        ...form,
        phone: form.phone || undefined,
        plan,
        termsAccepted: true,
        caslConsent: form.country === 'CA' ? caslConsent : undefined,
      });
      router.push('/onboarding');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not create account. Please try again.';
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  }

  const countryLabel = COUNTRIES.find((c) => c.code === form.country)?.label ?? form.country;
  const planInfo = PLANS[form.country][plan];

  return (
    <div className="flex w-full max-w-[520px] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Start your free trial</h1>
        <p className="text-sm text-muted">
          {TRIAL_DAYS}-day trial · No credit card required
        </p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div
              className={cn(
                'h-1 rounded-full',
                i <= step ? 'bg-primary' : 'bg-border'
              )}
            />
            <span className={cn('text-xs', i <= step ? 'text-primary' : 'text-muted')}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {errors.form && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{errors.form}</p>
      )}

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Input
            label="Business Name *"
            value={form.businessName}
            onChange={(e) => updateForm({ businessName: e.target.value })}
            error={errors.businessName}
          />
          <Input
            label="Owner Name *"
            value={form.ownerName}
            onChange={(e) => updateForm({ ownerName: e.target.value })}
            error={errors.ownerName}
          />
          <Input
            label="Email *"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => updateForm({ email: e.target.value })}
            error={errors.email}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Password *"
              type="password"
              value={form.password}
              onChange={(e) => updateForm({ password: e.target.value })}
              error={errors.password}
            />
            {form.password && (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={cn(
                        'h-1 flex-1 rounded-full',
                        (strength === 'weak' && n === 1) ||
                          (strength === 'medium' && n <= 2) ||
                          (strength === 'strong' && n <= 3)
                          ? strength === 'weak'
                            ? 'bg-danger'
                            : strength === 'medium'
                              ? 'bg-warning'
                              : 'bg-success'
                          : 'bg-border'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs capitalize text-muted">{strength}</span>
              </div>
            )}
          </div>
          <Input
            label="Phone (for WhatsApp)"
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => updateForm({ phone: e.target.value })}
            error={errors.phone}
          />
          <Select
            label="Country"
            value={form.country}
            onChange={(e) => updateForm({ country: e.target.value as Country })}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
          />
          <Button type="button" fullWidth onClick={handleStep1Continue}>
            Continue →
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex rounded-lg border border-border p-1">
            {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBilling(cycle)}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium capitalize transition-colors',
                  billing === cycle ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
                )}
              >
                {cycle}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {(Object.keys(PLANS[form.country]) as PlanId[]).map((planId) => {
              const info = PLANS[form.country][planId];
              const price =
                billing === 'annual' ? Math.round(info.price * 10) : info.price;
              const period = billing === 'annual' ? '/yr' : '/mo';

              return (
                <button
                  key={planId}
                  type="button"
                  onClick={() => setPlan(planId)}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      'cursor-pointer transition-shadow hover:shadow-md',
                      plan === planId && 'border-primary ring-2 ring-primary/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{info.name}</span>
                          {planId === 'pro' && <Badge variant="primary">Popular</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {info.aiMsgs.toLocaleString()} AI msgs ·{' '}
                          {info.properties === -1 ? 'Unlimited' : info.properties} properties ·{' '}
                          {info.team} team
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(price, currency)}
                        </span>
                        <span className="text-xs text-muted">{period}</span>
                      </div>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowPromo(!showPromo)}
            className="text-left text-sm text-primary hover:underline"
          >
            Enter promo code
          </button>
          {showPromo && (
            <Input
              placeholder="Promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="button" fullWidth onClick={() => setStep(2)}>
              Start Free {TRIAL_DAYS}-Day Trial →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <Card>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Business</dt>
                <dd className="font-medium">{form.businessName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Email</dt>
                <dd className="font-medium">{form.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Plan</dt>
                <dd className="font-medium">{planInfo.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Market</dt>
                <dd className="font-medium">{countryLabel}</dd>
              </div>
            </dl>
          </Card>

          <Checkbox
            label={
              form.country === 'IN' ? (
                <>
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  . PropAgent will process my data per India&apos;s DPDP Act.
                </>
              ) : (
                <>
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </>
              )
            }
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            error={errors.termsAccepted}
          />

          {form.country === 'CA' && (
            <Checkbox
              label="I consent to receive WhatsApp messages from PropAgent about my account."
              checked={caslConsent}
              onChange={(e) => setCaslConsent(e.target.checked)}
              error={errors.caslConsent}
            />
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="button" fullWidth loading={loading} onClick={handleCreateAccount}>
              Create My Account
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
