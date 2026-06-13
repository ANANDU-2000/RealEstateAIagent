import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  COOKIE_OPTIONS,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json();

  if (!res.ok) {
    cookieStore.delete(REFRESH_COOKIE);
    cookieStore.delete(ACCESS_COOKIE);
    return NextResponse.json(data, { status: res.status });
  }

  cookieStore.set(REFRESH_COOKIE, data.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
  });
  cookieStore.set(ACCESS_COOKIE, data.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_MAX_AGE,
  });

  return NextResponse.json({ accessToken: data.accessToken });
}
