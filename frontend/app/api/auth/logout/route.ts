import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }

  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(ACCESS_COOKIE);

  return NextResponse.json({ ok: true });
}
