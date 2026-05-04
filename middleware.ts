import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';
import { isSameOrigin } from '@/lib/auth/csrf';

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/auth/:path*',
    '/api/products',
    '/api/products/:path*',
    '/api/orders',
    '/api/orders/:path*',
    '/api/inventory',
    '/api/inventory/:path*',
  ],
};

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function isPublicAuthEndpoint(path: string): boolean {
  return path === '/api/auth/login' || path === '/api/auth/logout';
}

function isPublicCheckout(path: string, method: string): boolean {
  return path === '/api/orders' && method === 'POST';
}

function needsSessionForApi(path: string, method: string): boolean {
  if (isPublicAuthEndpoint(path)) return false;
  if (isPublicCheckout(path, method)) return false;

  // All admin orders reads contain customer PII → protected.
  if (path === '/api/orders' || path.startsWith('/api/orders/')) return true;

  // Inventory dashboard endpoints — protected by session OR INVENTORY_API_KEY
  // (read endpoints handle the API-key option in their own handlers; the
  // middleware only short-circuits if a valid session is missing AND no api
  // key header is present).
  if (path === '/api/inventory' && method === 'GET') {
    return true;
  }
  if (path === '/api/inventory/history' && method === 'GET') {
    return true;
  }

  // Snapshot + per-SKU reads are read-only "inventory API" used by external
  // integrations. Their handlers enforce INVENTORY_API_KEY directly. Skip
  // here so external callers without a session can still read with the key.
  if (
    method === 'GET' &&
    (path === '/api/inventory/snapshot' || path.startsWith('/api/inventory/'))
  ) {
    return false;
  }

  // Every state-changing request to a protected resource needs a session.
  if (WRITE_METHODS.has(method)) return true;

  return false;
}

function isAdminPage(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // ─── 1. CSRF: every state-changing request must originate from our host
  if (WRITE_METHODS.has(method) && !isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ─── 2. Admin pages → redirect to /login if no session
  if (isAdminPage(pathname)) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (!session) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ─── 3. Protected API routes → 401 JSON if no session
  if (pathname.startsWith('/api/') && needsSessionForApi(pathname, method)) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}
