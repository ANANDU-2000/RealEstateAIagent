const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function superadminUrl(path: string): string {
  const normalized = path.startsWith('/superadmin') ? path : `/superadmin${path}`;
  if (typeof window !== 'undefined') {
    return `/api${normalized}`;
  }
  return `${API_BASE_URL}${normalized}`;
}

async function saApiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(superadminUrl(path), {
      ...options,
      headers,
    });
  } catch {
    throw {
      error:
        'Cannot reach the PropAgent API. Check your internet connection or contact your administrator.',
      status: 0,
    } satisfies ApiError;
  }

  if (!response.ok) {
    let message = response.statusText;
    let requiresTotp: boolean | undefined;
    try {
      const body = (await response.json()) as { error?: string; requiresTotp?: boolean };
      message = body.error ?? message;
      requiresTotp = body.requiresTotp;
    } catch {
      // ignore parse errors
    }
    throw { error: message, status: response.status, requiresTotp } satisfies SaLoginError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type ApiError = {
  error: string;
  status: number;
};

export type Tenant = {
  id: string;
  email: string;
  plan: string;
  clientId: string;
  businessName: string;
  ownerName: string;
  country: string;
};

export type AuthResponse = {
  accessToken: string;
  tenant: Tenant;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw { error: message, status: response.status } satisfies ApiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function authProxy<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw { error: data.error ?? 'Request failed', status: response.status } satisfies ApiError;
  }

  return data as T;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return authProxy<AuthResponse>('/api/auth/login', { email, password });
}

export async function register(payload: {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  country: 'IN' | 'AE' | 'CA';
  plan: 'starter' | 'pro' | 'agency' | 'trial';
  termsAccepted: true;
  caslConsent?: boolean;
}): Promise<AuthResponse> {
  return authProxy<AuthResponse>('/api/auth/register', payload);
}

export async function refreshAccessToken(): Promise<string | null> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export type OnboardingStatus = {
  ownerName: string;
  aiName: string;
  whatsappNumber: string | null;
  steps: {
    accountCreated: boolean;
    whatsappConnected: boolean;
    hasProperty: boolean;
    hasAvailability: boolean;
    hasOfficeAddress: boolean;
  };
  completedCount: number;
  totalSteps: number;
  quickStepsCompleted: number;
  quickStepsTotal: number;
};

export async function getOnboardingStatus(token: string): Promise<OnboardingStatus> {
  return apiFetch('/settings/onboarding-status', {}, token);
}

export type WhatsAppSettings = {
  whatsappNumber: string | null;
  metaPhoneNumberId: string | null;
  metaWabaId: string | null;
  hasAccessToken: boolean;
  whatsappConnected: boolean;
  whatsappConnectedAt: string | null;
};

export type WhatsAppSettingsUpdate = {
  whatsappNumber?: string | null;
  metaPhoneNumberId?: string | null;
  metaAccessToken?: string | null;
  metaWabaId?: string | null;
};

export type OfficeSettings = {
  officeAddress: string | null;
  officeCity: string | null;
  officeMapsLink: string | null;
  reminderBeforeVisit: '30min' | '1hr' | '2hr' | '1day';
  customerReminder: boolean;
  customerReminderTime: '1hr' | '2hr' | '1day';
};

export type OfficeSettingsUpdate = Partial<OfficeSettings>;

export type AiSettings = {
  aiName: string;
  aiTone: 'friendly' | 'professional' | 'mix';
  aiFollowupCount: number;
  aiFollowupGap: '3hr' | '6hr' | 'next_morning';
  noMsgAfterHour: number;
  languageDefault: 'english' | 'hinglish';
};

export type AiSettingsUpdate = Partial<AiSettings>;

export type AvailabilitySlot = {
  id?: string;
  dayOfWeek: number;
  slotTime: string;
  isActive: boolean;
};

export type AvailabilityResponse = {
  slotsByDay: Record<string, Array<{ id: string; slotTime: string; isActive: boolean }>>;
};

export async function getWhatsAppSettings(token: string): Promise<WhatsAppSettings> {
  return apiFetch('/settings/whatsapp', {}, token);
}

export async function updateWhatsAppSettings(
  token: string,
  payload: WhatsAppSettingsUpdate
): Promise<{
  ok: boolean;
  whatsappNumber: string | null;
  metaPhoneNumberId: string | null;
  metaWabaId: string | null;
  whatsappConnected: boolean;
}> {
  return apiFetch(
    '/settings/whatsapp',
    { method: 'PATCH', body: JSON.stringify(payload) },
    token
  );
}

export async function testWhatsAppConnection(
  token: string
): Promise<{ ok: boolean; message: string }> {
  return apiFetch('/settings/whatsapp/test', { method: 'POST' }, token);
}

export async function updateWhatsAppNumber(
  token: string,
  whatsappNumber: string
): Promise<{
  ok: boolean;
  whatsappNumber: string | null;
  metaPhoneNumberId: string | null;
  metaWabaId: string | null;
  whatsappConnected: boolean;
}> {
  return updateWhatsAppSettings(token, { whatsappNumber });
}

export async function getOfficeSettings(token: string): Promise<OfficeSettings> {
  return apiFetch('/settings/office', {}, token);
}

export async function updateOfficeSettings(
  token: string,
  payload: OfficeSettingsUpdate
): Promise<{ ok: boolean }> {
  return apiFetch(
    '/settings/office',
    { method: 'PATCH', body: JSON.stringify(payload) },
    token
  );
}

export async function getAiSettings(token: string): Promise<AiSettings> {
  return apiFetch('/settings/ai', {}, token);
}

export async function updateAiSettings(
  token: string,
  payload: AiSettingsUpdate
): Promise<{ ok: boolean }> {
  return apiFetch('/settings/ai', { method: 'PATCH', body: JSON.stringify(payload) }, token);
}

export async function getAiPromptPreview(token: string): Promise<{ preview: string }> {
  return apiFetch('/settings/ai/prompt-preview', {}, token);
}

export async function getAvailability(token: string): Promise<AvailabilityResponse> {
  return apiFetch('/settings/availability', {}, token);
}

export async function saveAvailability(
  token: string,
  slots: AvailabilitySlot[]
): Promise<{ ok: boolean; count: number }> {
  return apiFetch(
    '/settings/availability',
    { method: 'POST', body: JSON.stringify({ slots }) },
    token
  );
}

export async function getHealth(): Promise<{
  ok: boolean;
  service: string;
  time: string;
  db: string;
}> {
  return apiFetch('/health');
}

export type SaClient = {
  clientId: string;
  businessName: string;
  ownerName: string;
  email: string;
  country: string;
  plan: string;
  status: string;
  joinedAt: string;
  aiUsed: number;
  aiLimit: number;
  aiResetDate?: string | null;
  monthlyPricePaise?: number | null;
  monthlyPriceCurrency?: string;
  isSuspended?: boolean;
  isBlocked?: boolean;
};

export type SaStats = {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  totalAiMessagesToday: number;
  totalMeetingsToday: number;
};

export type SaPrompt = {
  content: string;
  version: number;
  updatedAt: string;
};

export const SA_PLAN_AI_LIMITS: Record<'starter' | 'pro' | 'agency' | 'trial', number> = {
  starter: 500,
  pro: 2000,
  agency: 10000,
  trial: 100,
};

export type SaLoginResult = {
  accessToken: string;
  admin: { id: string; email: string; name: string | null };
  requiresTotp?: boolean;
};

export type SaLoginError = ApiError & { requiresTotp?: boolean };

export type SaCreateClientResult = {
  client: {
    id: string;
    clientId: string;
    email: string;
    plan: string;
    businessName: string;
    ownerName: string;
    country: string;
  };
  temporaryPassword: string;
  loginUrl: string;
  message: string;
};

export async function saLogin(
  email: string,
  password: string,
  totpCode?: string
): Promise<SaLoginResult> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  let response: Response;

  try {
    response = await fetch(superadminUrl('/superadmin/login'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password, totpCode }),
    });
  } catch {
    throw {
      error:
        'Cannot reach the PropAgent API. Check your internet connection or contact your administrator.',
      status: 0,
    } satisfies SaLoginError;
  }

  let data: SaLoginResult & { error?: string; requiresTotp?: boolean };
  try {
    data = (await response.json()) as SaLoginResult & {
      error?: string;
      requiresTotp?: boolean;
    };
  } catch {
    throw {
      error: 'Unexpected server response. Please try again.',
      status: response.status,
    } satisfies SaLoginError;
  }

  if (!response.ok) {
    throw {
      error: data.error ?? 'Invalid email or password.',
      status: response.status,
      requiresTotp: data.requiresTotp,
    } satisfies SaLoginError;
  }

  return data;
}

export async function saGetStats(token: string): Promise<SaStats> {
  return saApiFetch('/superadmin/stats', {}, token);
}

export async function saGetPrompt(token: string): Promise<SaPrompt> {
  return saApiFetch('/superadmin/prompt', {}, token);
}

export async function saUpdatePrompt(
  token: string,
  content: string
): Promise<{ ok: boolean; version: number }> {
  return saApiFetch(
    '/superadmin/prompt',
    { method: 'PATCH', body: JSON.stringify({ content }) },
    token
  );
}

export async function saUpdateClientStatus(
  token: string,
  clientId: string,
  action: 'suspend' | 'unsuspend' | 'block' | 'unblock'
): Promise<{ ok: boolean }> {
  return saApiFetch(
    `/superadmin/clients/${clientId}/status`,
    { method: 'PATCH', body: JSON.stringify({ action }) },
    token
  );
}

export async function saUpdateClientPlan(
  token: string,
  clientId: string,
  plan: 'starter' | 'pro' | 'agency' | 'trial',
  aiMessageLimit?: number
): Promise<{ ok: boolean }> {
  return saApiFetch(
    `/superadmin/clients/${clientId}/plan`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        plan,
        aiMessageLimit: aiMessageLimit ?? SA_PLAN_AI_LIMITS[plan],
      }),
    },
    token
  );
}

export async function saUpdateClientUsage(
  token: string,
  clientId: string,
  payload: {
    aiMessageLimit?: number;
    resetUsage?: boolean;
    monthlyPricePaise?: number | null;
    monthlyPriceCurrency?: 'INR' | 'AED' | 'CAD';
  }
): Promise<{ ok: boolean }> {
  return saApiFetch(
    `/superadmin/clients/${clientId}/usage`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    token
  );
}

export async function saDuplicateClient(
  token: string,
  clientId: string,
  payload: { email: string; businessName?: string; ownerName?: string }
): Promise<SaCreateClientResult> {
  return saApiFetch(
    `/superadmin/clients/${clientId}/duplicate`,
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function saListClients(token: string): Promise<{ clients: SaClient[] }> {
  return saApiFetch('/superadmin/clients', {}, token);
}

export type SaAiUsageRow = {
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  fallbackUsed: boolean;
  createdAt: string;
};

export type SaAiFailureRow = {
  errorMessage: string;
  createdAt: string;
};

export type SaDeliveryFailureRow = {
  content: string;
  createdAt: string;
};

export type SaClientAiActivity = {
  usage: SaAiUsageRow[];
  failures: SaAiFailureRow[];
  deliveryFailures: SaDeliveryFailureRow[];
};

export async function saGetClientAiActivity(
  token: string,
  clientId: string
): Promise<SaClientAiActivity> {
  return saApiFetch(`/superadmin/clients/${clientId}/ai-activity`, {}, token);
}

export async function saCreateClient(
  token: string,
  payload: {
    businessName: string;
    ownerName: string;
    email: string;
    phone?: string;
    country: 'IN' | 'AE' | 'CA';
    plan: 'starter' | 'pro' | 'agency' | 'trial';
    trialDays: number;
  }
): Promise<SaCreateClientResult> {
  return saApiFetch(
    '/superadmin/clients',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export type LeadStage =
  | 'new'
  | 'qualified'
  | 'interested'
  | 'hot'
  | 'ultra_hot'
  | 'meeting_booked'
  | 'visited'
  | 'low_budget'
  | 'cold'
  | 'won'
  | 'lost';

export type Conversation = {
  id: string;
  customerPhone: string;
  customerName: string | null;
  status: string;
  intent: string;
  leadStage: LeadStage;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredType: string | null;
  preferredArea: string | null;
  languagePref: string;
  leadScore: number;
  humanOverride: boolean;
  aiPaused: boolean;
  followupCount: number;
  followupCapped: boolean;
  isReturning: boolean;
  callbackRequested: boolean;
  callbackRequestedTime: string | null;
  voiceNoteReceived: boolean;
  optedOut: boolean;
  isNri: boolean;
  assignedTo: string | null;
  brokerNotes: string | null;
  lastBrokerRead: string | null;
  firstMessageAt: string;
  lastMessageAt: string;
  createdAt: string;
  lastMessagePreview: string | null;
  lastMessageSender: string | null;
  messageCount?: number;
  unread: boolean;
};

export type Message = {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  sender: 'customer' | 'ai' | 'broker' | 'system';
  content: string;
  mediaType: string;
  mediaUrl: string | null;
  whatsappMsgId: string | null;
  aiModelUsed: string | null;
  aiConfidence: number | null;
  status: string;
  sentAt: string;
};

export type Escalation = {
  id: string;
  conversationId: string | null;
  escalationType: string;
  triggeredAt: string;
  ownerNotifiedAt: string | null;
  resolved: boolean;
  notes: string | null;
};

export type ConversationUpdateInput = {
  humanOverride?: boolean;
  aiPaused?: boolean;
  leadStage?: LeadStage;
  customerName?: string;
  brokerNotes?: string;
  assignedTo?: string | null;
};

export type ListConversationsParams = {
  status?: string;
  intent?: string;
  search?: string;
  limit?: number;
  offset?: number;
  count?: boolean;
};

export async function listConversations(
  token: string,
  params: ListConversationsParams = {}
): Promise<{
  conversations: Conversation[];
  unreadCount?: number;
  overdueCallbacks?: number;
}> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.intent) qs.set('intent', params.intent);
  if (params.search) qs.set('search', params.search);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));
  if (params.count) qs.set('count', 'true');
  const query = qs.toString();
  return apiFetch(`/conversations${query ? `?${query}` : ''}`, {}, token);
}

export async function getConversationCounts(
  token: string
): Promise<{ unreadCount: number; overdueCallbacks: number }> {
  return apiFetch('/conversations?count=true&limit=0', {}, token);
}

export async function getConversation(
  token: string,
  id: string
): Promise<{
  conversation: Conversation;
  messages: Message[];
  escalations: Escalation[];
}> {
  return apiFetch(`/conversations/${id}`, {}, token);
}

export async function getConversationMessages(
  token: string,
  id: string,
  params: { before?: string; limit?: number } = {}
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const qs = new URLSearchParams();
  if (params.before) qs.set('before', params.before);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return apiFetch(`/conversations/${id}/messages${query ? `?${query}` : ''}`, {}, token);
}

export async function updateConversation(
  token: string,
  id: string,
  data: ConversationUpdateInput
): Promise<{ conversation: Conversation }> {
  return apiFetch(
    `/conversations/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    token
  );
}

export async function sendConversationMessage(
  token: string,
  id: string,
  content: string
): Promise<{ message: Message }> {
  return apiFetch(
    `/conversations/${id}/send`,
    { method: 'POST', body: JSON.stringify({ content }) },
    token
  );
}

export async function markConversationRead(
  token: string,
  id: string
): Promise<{ conversation: Conversation }> {
  return apiFetch(`/conversations/${id}/read`, { method: 'PATCH' }, token);
}

export async function updateConversationStage(
  token: string,
  id: string,
  leadStage: LeadStage
): Promise<{ conversation: Conversation }> {
  return apiFetch(
    `/conversations/${id}/stage`,
    { method: 'PATCH', body: JSON.stringify({ leadStage }) },
    token
  );
}

export const LEAD_STAGES: LeadStage[] = [
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
];

export type AnalyticsRange = 7 | 30 | 90;

export type AnalyticsData = {
  range: number;
  totalLeads: number;
  totalLeadsChange: number | null;
  meetingsBooked: number;
  meetingsBookedChange: number | null;
  hotLeads: number;
  ultraHotLeads: number;
  coldLeads: number;
  callbacksDone: number;
  callbacksPending: number;
  lowBudgetEscalations: number;
  conversionRate: number;
  aiMessagesUsed: number;
  aiMessageLimit: number;
  daysUntilReset: number | null;
  aiCostEstimate: number;
  leadsPerDay: Array<{ date: string; count: number }>;
  leadsByPropertyType: Array<{ propertyType: string; count: number }>;
  languageBreakdown: Array<{ language: string; count: number }>;
  propertyPerformance: Array<{
    id: string;
    name: string;
    enquiries: number;
    visits: number;
    conversionRate: number;
  }>;
  aiUsageDaily: Array<{ date: string; messages: number; costUsd: number }>;
};

export async function getAnalytics(
  token: string,
  range: AnalyticsRange = 30
): Promise<AnalyticsData> {
  return apiFetch(`/analytics?range=${range}`, {}, token);
}

export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'house'
  | 'studio'
  | 'penthouse'
  | 'residential_plot'
  | 'agricultural_land'
  | 'commercial_land'
  | 'shop'
  | 'office'
  | 'warehouse'
  | 'building';

export type ListingType = 'sale' | 'rent';
export type AreaUnit = 'sqft' | 'sqyards' | 'acres' | 'kanal' | 'bigha' | 'marla';
export type PropertyCurrency = 'INR' | 'AED' | 'CAD';
export type PropertyStatus = 'available' | 'sold' | 'hidden' | 'rented';

export type Property = {
  id: string;
  name: string;
  propertyType: PropertyType;
  listingType: ListingType;
  areaSize: number | null;
  areaUnit: AreaUnit;
  price: number;
  currency: PropertyCurrency;
  city: string;
  location: string;
  areaTags: string[];
  details: string | null;
  isAvailable: boolean;
  isHidden: boolean;
  landType: string | null;
  status: string;
  enquiryCount: number;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export type PropertyPhoto = {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
  fileSizeKb: number | null;
  uploadedAt: string;
};

export type PropertyCreatePayload = {
  name: string;
  propertyType: PropertyType;
  listingType?: ListingType;
  areaSize?: number;
  areaUnit?: AreaUnit;
  price: number;
  currency?: PropertyCurrency;
  city: string;
  location: string;
  details?: string;
  areaTags?: string[];
  landType?: string;
  status?: PropertyStatus;
};

export type PropertyUpdatePayload = Partial<PropertyCreatePayload>;

export type PropertyListParams = {
  type?: PropertyType;
  available?: boolean;
  search?: string;
  includeHidden?: boolean;
};

export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'residential_plot', label: 'Residential Plot' },
  { value: 'agricultural_land', label: 'Agricultural Land' },
  { value: 'commercial_land', label: 'Commercial Land' },
  { value: 'shop', label: 'Shop' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'building', label: 'Building' },
];

export const LAND_PROPERTY_TYPES: PropertyType[] = [
  'residential_plot',
  'agricultural_land',
  'commercial_land',
];

export const LAND_TYPE_OPTIONS = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Agricultural', label: 'Agricultural' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Industrial', label: 'Industrial' },
];

export function currencyForCountry(country?: string): PropertyCurrency {
  if (country === 'AE') return 'AED';
  if (country === 'CA') return 'CAD';
  return 'INR';
}

export function formatPropertyPrice(price: number, currency: string): string {
  if (currency === 'INR') {
    const lakhs = price / 100_000;
    if (lakhs >= 100) {
      const crores = lakhs / 100;
      const formatted = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(1);
      return `₹${formatted}Cr`;
    }
    const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1);
    return `₹${formatted}L`;
  }

  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${currency} ${formatted}M`;
  }

  if (price >= 1_000) {
    const thousands = price / 1_000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${currency} ${formatted}K`;
  }

  return `${currency} ${price.toLocaleString()}`;
}

export function propertyStatusLabel(status: string, isHidden?: boolean): string {
  if (isHidden || status === 'hidden') return 'Hidden';
  if (status === 'sold' || status === 'rented') return 'Sold';
  return 'Available';
}

export function propertyStatusVariant(
  status: string,
  isHidden?: boolean
): 'success' | 'warning' | 'default' {
  if (isHidden || status === 'hidden') return 'default';
  if (status === 'sold' || status === 'rented') return 'warning';
  return 'success';
}

function buildQuery(params?: PropertyListParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  if (params.type) search.set('type', params.type);
  if (params.available !== undefined) search.set('available', String(params.available));
  if (params.search) search.set('search', params.search);
  if (params.includeHidden) search.set('includeHidden', 'true');
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listProperties(
  token: string,
  params?: PropertyListParams
): Promise<{ properties: Property[] }> {
  return apiFetch(`/properties${buildQuery(params)}`, {}, token);
}

export async function getProperty(
  token: string,
  id: string
): Promise<{ property: Property; photos: PropertyPhoto[] }> {
  return apiFetch(`/properties/${id}`, {}, token);
}

export async function createProperty(
  token: string,
  payload: PropertyCreatePayload
): Promise<{ property: Property }> {
  return apiFetch(
    '/properties',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function updateProperty(
  token: string,
  id: string,
  payload: PropertyUpdatePayload
): Promise<{ property: Property }> {
  return apiFetch(
    `/properties/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token
  );
}

export async function deleteProperty(token: string, id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/properties/${id}`, { method: 'DELETE' }, token);
}

export async function updatePropertyStatus(
  token: string,
  id: string,
  status: 'available' | 'sold' | 'hidden'
): Promise<{ ok: boolean; status: string }> {
  return apiFetch(
    `/properties/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    token
  );
}

export async function addPropertyPhoto(
  token: string,
  propertyId: string,
  payload: { url: string; caption?: string; isCover?: boolean; sortOrder?: number }
): Promise<{ photo: PropertyPhoto }> {
  return apiFetch(
    `/properties/${propertyId}/photos`,
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function deletePropertyPhoto(
  token: string,
  propertyId: string,
  photoId: string
): Promise<{ ok: boolean }> {
  return apiFetch(`/properties/${propertyId}/photos/${photoId}`, { method: 'DELETE' }, token);
}

export type MeetingType = 'site_visit' | 'office' | 'callback';
export type MeetingStatus = 'confirmed' | 'cancelled' | 'no_show' | 'completed';

export type Meeting = {
  id: string;
  conversationId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  propertyId: string | null;
  propertyName: string | null;
  meetingType: MeetingType;
  scheduledAt: string;
  bookedBy: string;
  status: MeetingStatus | string;
  reminderSentAt: string | null;
  brokerReminded: boolean;
  notes: string | null;
  createdAt: string;
};

export type MeetingListParams = {
  from?: string;
  to?: string;
};

export type MeetingCreatePayload = {
  customerName?: string;
  customerPhone: string;
  conversationId?: string;
  propertyId?: string;
  meetingType?: MeetingType;
  scheduledAt: string;
  notes?: string;
};

export type MeetingUpdatePayload = {
  status?: MeetingStatus;
  scheduledAt?: string;
  notes?: string;
};

export type CallbackStatus = 'pending' | 'overdue' | 'done';

export type Callback = {
  id: string;
  conversationId: string | null;
  customerName: string | null;
  customerPhone: string;
  requestedTime: string | null;
  contextNotes: string | null;
  status: CallbackStatus | string;
  createdAt: string;
  completedAt: string | null;
};

export type CallbackListParams = {
  status?: CallbackStatus;
};

export type CallbackUpdatePayload = {
  status?: CallbackStatus;
  completedAt?: string | null;
};

export const MEETING_TYPE_OPTIONS: { value: MeetingType; label: string }[] = [
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'office', label: 'Office Visit' },
  { value: 'callback', label: 'Callback' },
];

function buildMeetingQuery(params?: MeetingListParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function buildCallbackQuery(params?: CallbackListParams): string {
  if (!params?.status) return '';
  return `?status=${params.status}`;
}

export async function listMeetings(
  token: string,
  params?: MeetingListParams
): Promise<{ meetings: Meeting[] }> {
  return apiFetch(`/meetings${buildMeetingQuery(params)}`, {}, token);
}

export async function createMeeting(
  token: string,
  payload: MeetingCreatePayload
): Promise<{ meeting: Meeting }> {
  return apiFetch(
    '/meetings',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function updateMeeting(
  token: string,
  id: string,
  payload: MeetingUpdatePayload
): Promise<{ meeting: Meeting }> {
  return apiFetch(
    `/meetings/${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    token
  );
}

export async function listCallbacks(
  token: string,
  params?: CallbackListParams
): Promise<{ callbacks: Callback[] }> {
  return apiFetch(`/callbacks${buildCallbackQuery(params)}`, {}, token);
}

export async function updateCallback(
  token: string,
  id: string,
  payload: CallbackUpdatePayload
): Promise<{ callback: Callback }> {
  return apiFetch(
    `/callbacks/${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    token
  );
}

export { API_BASE_URL };
