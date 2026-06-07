const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

export async function updateWhatsAppNumber(
  token: string,
  whatsappNumber: string
): Promise<{ ok: boolean; whatsappNumber: string }> {
  return apiFetch(
    '/settings/whatsapp',
    { method: 'PATCH', body: JSON.stringify({ whatsappNumber }) },
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

export { API_BASE_URL };
