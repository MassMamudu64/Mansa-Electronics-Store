/**
 * HMAC-signed session tokens. Edge-runtime safe (Web Crypto only).
 *
 * Token format: base64url(JSON payload) "." base64url(HMAC-SHA256 signature)
 * Cookie:       HttpOnly, Secure (prod), SameSite=Strict, 8h lifetime.
 *
 * Required env: ADMIN_SESSION_SECRET (>= 32 bytes of high-entropy random)
 */

export const SESSION_COOKIE = 'mansa_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export interface SessionPayload {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET is missing or too short (must be >= 32 chars)',
    );
  }
  return secret;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSession(opts: { sub: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: opts.sub,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    jti: crypto.randomUUID(),
  };
  const enc = new TextEncoder();
  const encodedPayload = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const key = await getKey();
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(encodedPayload));
  return `${encodedPayload}.${b64urlEncode(new Uint8Array(sigBuf))}`;
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot < 1 || dot === token.length - 1) return null;

  const encodedPayload = token.slice(0, dot);
  const encodedSig = token.slice(dot + 1);

  let sig: Uint8Array;
  try {
    sig = b64urlDecode(encodedSig);
  } catch {
    return null;
  }

  let key: CryptoKey;
  try {
    key = await getKey();
  } catch {
    return null;
  }

  const valid = await crypto.subtle
    .verify(
      'HMAC',
      key,
      sig as unknown as BufferSource,
      new TextEncoder().encode(encodedPayload) as unknown as BufferSource,
    )
    .catch(() => false);

  if (!valid) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(encodedPayload)));
  } catch {
    return null;
  }

  if (
    typeof payload?.sub !== 'string' ||
    typeof payload?.exp !== 'number' ||
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return payload;
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
