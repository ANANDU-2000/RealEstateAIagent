'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  saCreateClient,
  saListClients,
  saLogin,
  type SaClient,
  type SaCreateClientResult,
} from '@/lib/api';

type SaAuthContextValue = {
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  listClients: () => Promise<SaClient[]>;
  createClient: (payload: {
    businessName: string;
    ownerName: string;
    email: string;
    phone?: string;
    country: 'IN' | 'AE' | 'CA';
    plan: 'starter' | 'pro' | 'agency' | 'trial';
    trialDays: number;
  }) => Promise<SaCreateClientResult>;
};

const SaAuthContext = createContext<SaAuthContextValue | null>(null);
const SA_TOKEN_KEY = 'propagent_sa_token';

export function SaAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(sessionStorage.getItem(SA_TOKEN_KEY));
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await saLogin(email, password);
    sessionStorage.setItem(SA_TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SA_TOKEN_KEY);
    setToken(null);
  }, []);

  const listClients = useCallback(async () => {
    if (!token) throw new Error('Not authenticated');
    const data = await saListClients(token);
    return data.clients;
  }, [token]);

  const createClient = useCallback(
    async (payload: Parameters<SaAuthContextValue['createClient']>[0]) => {
      if (!token) throw new Error('Not authenticated');
      return saCreateClient(token, payload);
    },
    [token]
  );

  const value = useMemo(
    () => ({ token, loading, login, logout, listClients, createClient }),
    [token, loading, login, logout, listClients, createClient]
  );

  return <SaAuthContext.Provider value={value}>{children}</SaAuthContext.Provider>;
}

export function useSaAuth(): SaAuthContextValue {
  const ctx = useContext(SaAuthContext);
  if (!ctx) throw new Error('useSaAuth must be used within SaAuthProvider');
  return ctx;
}
