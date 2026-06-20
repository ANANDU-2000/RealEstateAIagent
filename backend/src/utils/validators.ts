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
  totpCode: z.string().length(6).optional(),
});

export const saClientStatusSchema = z.object({
  action: z.enum(['suspend', 'unsuspend', 'block', 'unblock']),
});

export const saClientPlanSchema = z.object({
  plan: z.enum(['starter', 'pro', 'agency', 'trial']),
  aiMessageLimit: z.number().int().min(0).max(100000),
});

export const saClientUsageSchema = z
  .object({
    aiMessageLimit: z.number().int().min(0).max(100000).optional(),
    resetUsage: z.boolean().optional(),
    monthlyPricePaise: z.number().int().min(0).max(999_999_999).nullable().optional(),
    monthlyPriceCurrency: z.enum(['INR', 'AED', 'CAD']).optional(),
  })
  .refine(
    (data) =>
      data.aiMessageLimit !== undefined ||
      data.resetUsage === true ||
      data.monthlyPricePaise !== undefined ||
      data.monthlyPriceCurrency !== undefined,
    { message: 'Provide at least one field to update' }
  );

export const saDuplicateClientSchema = z.object({
  email: z.string().email(),
  businessName: z.string().min(2).max(200).optional(),
  ownerName: z.string().min(2).max(200).optional(),
});

export const saPromptSchema = z.object({
  content: z.string().min(50, 'Prompt is too short'),
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

const propertyTypes = [
  'apartment',
  'villa',
  'house',
  'studio',
  'penthouse',
  'residential_plot',
  'agricultural_land',
  'commercial_land',
  'shop',
  'office',
  'warehouse',
  'building',
] as const;

export const propertyCreateSchema = z.object({
  name: z.string().min(2, 'Property name is required').max(200),
  propertyType: z.enum(propertyTypes),
  listingType: z.enum(['sale', 'rent']).optional().default('sale'),
  areaSize: z.number().positive().optional(),
  areaUnit: z
    .enum(['sqft', 'sqyards', 'acres', 'kanal', 'bigha', 'marla'])
    .optional()
    .default('sqft'),
  price: z.number().int().positive('Price must be a positive number'),
  currency: z.enum(['INR', 'AED', 'CAD']).optional().default('INR'),
  city: z.string().min(1, 'City is required').max(100),
  location: z.string().min(1, 'Area/locality is required').max(300),
  details: z.string().max(500).optional(),
  areaTags: z.array(z.string().min(1).max(50)).optional().default([]),
  landType: z.string().max(30).optional(),
  status: z.enum(['available', 'sold', 'hidden', 'rented']).optional(),
});

export const propertyUpdateSchema = propertyCreateSchema.partial();

export const propertyStatusSchema = z.object({
  status: z.enum(['available', 'sold', 'hidden']),
});

export const propertyPhotoSchema = z.object({
  url: z.string().url('Enter a valid photo URL'),
  caption: z.string().max(200).optional(),
  isCover: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;

const leadStages = [
  'new',
  'qualified',
  'interested',
  'hot',
  'ultra_hot',
  'meeting_booked',
  'visited',
  'low_budget',
  'cold',
  'won',
  'lost',
] as const;

export const conversationListQuerySchema = z
  .object({
    status: z.string().max(20).optional(),
    intent: z.string().max(20).optional(),
    search: z.string().max(200).optional(),
    limit: z.coerce.number().int().min(0).max(100).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
    count: z
      .union([z.literal('true'), z.literal('false'), z.boolean()])
      .optional()
      .transform((v) => v === true || v === 'true'),
  })
  .superRefine((data, ctx) => {
    if (data.limit === 0 && !data.count) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Too small: expected number to be >= 1',
        path: ['limit'],
      });
    }
  });

export const conversationUpdateSchema = z.object({
  humanOverride: z.boolean().optional(),
  aiPaused: z.boolean().optional(),
  leadStage: z.enum(leadStages).optional(),
  customerName: z.string().max(200).optional(),
  brokerNotes: z.string().max(5000).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

export const conversationStageSchema = z.object({
  leadStage: z.enum(leadStages),
});

export const conversationSendSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(4096),
});

export const conversationMessagesQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const meetingListQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const meetingCreateSchema = z.object({
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().min(8, 'Customer phone is required').max(20),
  conversationId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  meetingType: z.enum(['site_visit', 'office', 'callback']).optional().default('site_visit'),
  scheduledAt: z.string().datetime('Enter a valid scheduled time'),
  notes: z.string().max(2000).optional(),
});

export const meetingUpdateSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'no_show', 'completed']).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export const callbackListQuerySchema = z.object({
  status: z.enum(['pending', 'overdue', 'done']).optional(),
});

export const callbackUpdateSchema = z.object({
  status: z.enum(['pending', 'overdue', 'done']).optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

export const analyticsQuerySchema = z.object({
  range: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type ConversationUpdateInput = z.infer<typeof conversationUpdateSchema>;
export type MeetingCreateInput = z.infer<typeof meetingCreateSchema>;
export type MeetingUpdateInput = z.infer<typeof meetingUpdateSchema>;
export type CallbackUpdateInput = z.infer<typeof callbackUpdateSchema>;

const nullableOptionalString = z.union([z.string(), z.null()]).optional();

export const settingsWhatsappSchema = z
  .object({
    whatsappNumber: nullableOptionalString,
    metaPhoneNumberId: nullableOptionalString,
    metaAccessToken: nullableOptionalString,
    metaWabaId: nullableOptionalString,
  })
  .refine(
    (data) =>
      data.whatsappNumber !== undefined ||
      data.metaPhoneNumberId !== undefined ||
      data.metaAccessToken !== undefined ||
      data.metaWabaId !== undefined,
    { message: 'At least one field is required' }
  )
  .superRefine((data, ctx) => {
    if (typeof data.whatsappNumber === 'string') {
      const trimmed = data.whatsappNumber.trim();
      if (trimmed.length < 8 || trimmed.length > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid WhatsApp number',
          path: ['whatsappNumber'],
        });
      }
    }
    const token =
      typeof data.metaAccessToken === 'string' ? data.metaAccessToken.trim() : '';
    const phoneId =
      typeof data.metaPhoneNumberId === 'string' ? data.metaPhoneNumberId.trim() : '';
    if (token.length > 0 && phoneId.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Phone Number ID is required when an access token is set',
        path: ['metaPhoneNumberId'],
      });
    }
  });

export const settingsOfficeSchema = z.object({
  officeAddress: z.string().max(1000).nullable().optional(),
  officeCity: z.string().max(100).nullable().optional(),
  officeMapsLink: z
    .union([z.string().url('Enter a valid maps URL').max(500), z.literal(''), z.null()])
    .optional(),
  reminderBeforeVisit: z.enum(['30min', '1hr', '2hr', '1day']).optional(),
  customerReminder: z.boolean().optional(),
  customerReminderTime: z.enum(['1hr', '2hr', '1day']).optional(),
});

export const settingsAiSchema = z.object({
  aiName: z.string().min(1).max(50).optional(),
  aiTone: z.enum(['friendly', 'professional', 'mix']).optional(),
  aiFollowupCount: z.number().int().min(1).max(2).optional(),
  aiFollowupGap: z.enum(['3hr', '6hr', 'next_morning']).optional(),
  noMsgAfterHour: z.number().int().min(20).max(22).optional(),
  languageDefault: z.enum(['english', 'hinglish']).optional(),
});

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  slotTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Enter a valid time (HH:MM)'),
  isActive: z.boolean(),
});

export const availabilityPostSchema = z.object({
  slots: z.array(availabilitySlotSchema),
});

export type SettingsWhatsappInput = z.infer<typeof settingsWhatsappSchema>;
export type SettingsOfficeInput = z.infer<typeof settingsOfficeSchema>;
export type SettingsAiInput = z.infer<typeof settingsAiSchema>;
export type AvailabilityPostInput = z.infer<typeof availabilityPostSchema>;
