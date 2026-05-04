import { NextResponse, type NextRequest } from 'next/server';
import {
  signSession,
  sessionCookieOptions,
} from '@/lib/auth/session';
import { isSameOrigin, timingSafeEqual } from '@/lib/auth/csrf';
import {
  checkRate,
  recordFailure,
  resetAttempts,
  clientIp,
} from '@/lib/auth/rateLimit';
import { LoginSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UNIFORM_AUTH_ERROR = { error: 'Invalid credentials' };
const MIN_RESPONSE_MS = 300;

async function pad(start: number) {
  const elapsed = Date.now() - start;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();

  if (!isSameOrigin(req)) {
    await pad(start);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = clientIp(req);
  const rate = checkRate(ip);
  if (!rate.allowed) {
    await pad(start);
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } },
    );
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  const credentials = collectAdminCredentials();
  if (!secret || secret.length < 32 || credentials.length === 0) {
    console.error('[auth] Missing/invalid auth env vars');
    await pad(start);
    return NextResponse.json(UNIFORM_AUTH_ERROR, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    recordFailure(ip);
    await pad(start);
    return NextResponse.json(UNIFORM_AUTH_ERROR, { status: 401 });
  }

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    recordFailure(ip);
    await pad(start);
    return NextResponse.json(UNIFORM_AUTH_ERROR, { status: 401 });
  }

  // Constant-time compare against every configured admin so the response
  // time doesn't reveal which (or how many) IDs are valid.
  let matchedId: string | null = null;
  for (const cred of credentials) {
    const idOk = timingSafeEqual(parsed.data.id, cred.id);
    const pwOk = timingSafeEqual(parsed.data.password, cred.password);
    if (idOk && pwOk) matchedId = cred.id;
  }

  if (!matchedId) {
    recordFailure(ip);
    await pad(start);
    return NextResponse.json(UNIFORM_AUTH_ERROR, { status: 401 });
  }

  resetAttempts(ip);

  const token = await signSession({ sub: `admin:${matchedId}` });
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...sessionCookieOptions(), value: token });
  await pad(start);
  return res;
}

/**
 * Reads every ADMIN_ID / ADMIN_ID_2 / ADMIN_ID_N pair from env and returns
 * matched credential pairs. Empty array if nothing valid is configured.
 */
function collectAdminCredentials(): { id: string; password: string }[] {
  const out: { id: string; password: string }[] = [];
  const seenIds = new Set<string>();

  function take(idKey: string, pwKey: string) {
    const id = process.env[idKey];
    const pw = process.env[pwKey];
    if (id && pw && !seenIds.has(id)) {
      seenIds.add(id);
      out.push({ id, password: pw });
    }
  }

  take('ADMIN_ID', 'ADMIN_PASSWORD');
  for (const key of Object.keys(process.env)) {
    const m = /^ADMIN_ID_(\d+)$/.exec(key);
    if (m) take(`ADMIN_ID_${m[1]}`, `ADMIN_PASSWORD_${m[1]}`);
  }
  return out;
}
