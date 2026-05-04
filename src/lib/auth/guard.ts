/**
 * API route guards. Defense in depth — middleware should already block
 * unauthenticated requests, but routes call requireSession() too so a
 * misconfigured matcher can't expose a write endpoint.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession, type SessionPayload } from './session';
import { isSameOrigin } from './csrf';

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function requireSession(): Promise<
  { ok: true; session: SessionPayload } | { ok: false; res: Response }
> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true, session };
}

export function requireSameOrigin(req: Request): Response | null {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export function badRequest(msg = 'Invalid request'): Response {
  return NextResponse.json({ error: msg }, { status: 400 });
}
