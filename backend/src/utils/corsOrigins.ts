const DEFAULT_ORIGINS = ['http://localhost:3000'];

export function parseAllowedOrigins(): string[] {
  const fromList = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const frontend = process.env.FRONTEND_URL?.trim();

  const combined = [...(frontend ? [frontend] : []), ...fromList, ...DEFAULT_ORIGINS];
  return [...new Set(combined)];
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  return parseAllowedOrigins().includes(origin);
}

export function resolveCorsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean | string) => void
): void {
  if (!origin || isAllowedOrigin(origin)) {
    callback(null, origin ?? true);
    return;
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
}
