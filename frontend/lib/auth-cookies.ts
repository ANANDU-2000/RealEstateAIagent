export const REFRESH_COOKIE = 'propagent_refresh';
export const ACCESS_COOKIE = 'propagent_access';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
