'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, logout as apiLogout, register as apiRegister, refreshAccessToken } from '@/lib/api';

export type Tenant = {
  id: string;
  email: string;
  plan: string;
  clientId: string;
  businessName: string;
  ownerName: string;
  country: string;
};

type AuthContextValue = {
  tenant: Tenant | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

export type RegisterPayload = {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  country: 'IN' | 'AE' | 'CA';
  plan: 'starter' | 'pro' | 'agency' | 'trial';
  termsAccepted: true;
  caslConsent?: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TENANT_STORAGE_KEY = 'propagent_tenant';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const storedTenant = sessionStorage.getItem(TENANT_STORAGE_KEY);
    if (storedTenant) {
      try {
        setTenant(JSON.parse(storedTenant) as Tenant);
      } catch {
        sessionStorage.removeItem(TENANT_STORAGE_KEY);
      }
    }

    (async () => {
      try {
        const token = await refreshAccessToken();
        if (!cancelled && token) {
          setAccessToken(token);
        }
      } catch {
        // not logged in
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistTenant = useCallback((next: Tenant | null) => {
    setTenant(next);
    if (next) {
      sessionStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(TENANT_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setAccessToken(result.accessToken);
    persistTenant(result.tenant);
  }, [persistTenant]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await apiRegister(payload);
    setAccessToken(result.accessToken);
    persistTenant(result.tenant);
  }, [persistTenant]);

  const logout = useCallback(async () => {
    await apiLogout();
    setAccessToken(null);
    persistTenant(null);
  }, [persistTenant]);

  const value = useMemo(
    () => ({
      tenant,
      accessToken,
      loading,
      isAuthenticated: !!accessToken,
      login,
      register,
      logout,
    }),
    [tenant, accessToken, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
