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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
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

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setAccessToken(result.accessToken);
    setTenant(result.tenant);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await apiRegister(payload);
    setAccessToken(result.accessToken);
    setTenant(result.tenant);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setAccessToken(null);
    setTenant(null);
  }, []);

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
