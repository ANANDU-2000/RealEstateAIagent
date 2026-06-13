import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupStep1Schema = z.object({
  businessName: z.string().min(2, 'Business name is required').max(200),
  ownerName: z.string().min(2, 'Owner name is required').max(200),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  phone: z.string().max(20).optional(),
  country: z.enum(['IN', 'AE', 'CA']),
});

export const signupStep3Schema = z
  .object({
    termsAccepted: z.boolean(),
    caslConsent: z.boolean().optional(),
    country: z.enum(['IN', 'AE', 'CA']),
  })
  .superRefine((data, ctx) => {
    if (!data.termsAccepted) {
      ctx.addIssue({
        code: 'custom',
        message: 'You must accept the Terms and Privacy Policy',
        path: ['termsAccepted'],
      });
    }
    if (data.country === 'CA' && !data.caslConsent) {
      ctx.addIssue({
        code: 'custom',
        message: 'WhatsApp consent is required for Canadian accounts',
        path: ['caslConsent'],
      });
    }
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupStep1Data = z.infer<typeof signupStep1Schema>;

export function passwordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}
