export type Country = 'IN' | 'AE' | 'CA';
export type PlanId = 'starter' | 'pro' | 'agency';

export const COUNTRIES: { code: Country; label: string; currency: string }[] = [
  { code: 'IN', label: 'India', currency: 'INR' },
  { code: 'AE', label: 'UAE', currency: 'AED' },
  { code: 'CA', label: 'Canada', currency: 'CAD' },
];

export const PLANS: Record<
  Country,
  Record<PlanId, { name: string; price: number; aiMsgs: number; properties: number; team: number }>
> = {
  IN: {
    starter: { name: 'Starter', price: 2999, aiMsgs: 500, properties: 10, team: 1 },
    pro: { name: 'Pro', price: 5999, aiMsgs: 2000, properties: 50, team: 3 },
    agency: { name: 'Agency', price: 12999, aiMsgs: 10000, properties: -1, team: 10 },
  },
  AE: {
    starter: { name: 'Starter', price: 149, aiMsgs: 500, properties: 10, team: 1 },
    pro: { name: 'Pro', price: 299, aiMsgs: 2000, properties: 50, team: 3 },
    agency: { name: 'Agency', price: 649, aiMsgs: 10000, properties: -1, team: 10 },
  },
  CA: {
    starter: { name: 'Starter', price: 49, aiMsgs: 500, properties: 10, team: 1 },
    pro: { name: 'Pro', price: 99, aiMsgs: 2000, properties: 50, team: 3 },
    agency: { name: 'Agency', price: 199, aiMsgs: 10000, properties: -1, team: 10 },
  },
};

export function formatPrice(amount: number, currency: string): string {
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`;
  if (currency === 'AED') return `AED ${amount}`;
  return `CAD ${amount}`;
}

export const TRIAL_DAYS = 14;

export const CLIENT_ID_PREFIX: Record<Country, string> = {
  IN: 'PA-IN',
  AE: 'PA-AE',
  CA: 'PA-CA',
};
