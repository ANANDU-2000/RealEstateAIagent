import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name is required').max(200),
  ownerName: z.string().min(2, 'Owner name is required').max(200),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  phone: z.string().max(20).optional(),
  country: z.enum(['IN', 'AE', 'CA']),
  plan: z.enum(['starter', 'pro', 'agency', 'trial']).default('trial'),
  termsAccepted: z.literal(true, 'You must accept the Terms and Privacy Policy'),
  caslConsent: z.boolean().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const saLoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const saCreateClientSchema = z.object({
  businessName: z.string().min(2).max(200),
  ownerName: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  country: z.enum(['IN', 'AE', 'CA']),
  plan: z.enum(['starter', 'pro', 'agency', 'trial']).default('trial'),
  trialDays: z.number().int().min(1).max(90).default(14),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SaCreateClientInput = z.infer<typeof saCreateClientSchema>;
