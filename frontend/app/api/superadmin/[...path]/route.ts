import { NextResponse } from 'next/server';
import { APP_NAME } from '@/lib/brand';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyRequest(request: Request, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  const targetPath = `/superadmin/${path.join('/')}`;
  const incomingUrl = new URL(request.url);
  const targetUrl = `${API_BASE}${targetPath}${incomingUrl.search}`;

  const headers = new Headers();
  const authorization = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');

  if (authorization) headers.set('Authorization', authorization);
  if (contentType) headers.set('Content-Type', contentType);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.text() : undefined;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });
  } catch {
    return NextResponse.json(
      { error: `Cannot reach the ${APP_NAME} API server. Check NEXT_PUBLIC_API_URL on Vercel.` },
      { status: 502 }
    );
  }

  const responseText = await response.text();
  const responseHeaders = new Headers();
  const responseType = response.headers.get('content-type');
  if (responseType) responseHeaders.set('Content-Type', responseType);

  return new NextResponse(responseText, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}
