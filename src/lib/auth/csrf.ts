/**
 * CSRF defense via Origin/Referer header check.
 *
 * Combined with SameSite=Strict cookies, this gives two independent layers:
 *   1. SameSite=Strict prevents the browser from attaching the session cookie
 *      to cross-site requests at all.
 *   2. Origin check rejects any state-changing request that doesn't originate
 *      from our own host (defense in depth — handles legacy clients and
 *      browser bugs).
 */

export function isSameOrigin(req: Request): boolean {
  const host = req.headers.get('host');
  if (!host) return false;

  const origin = req.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  // Fallback for browsers that don't always set Origin on same-origin POSTs.
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  // No Origin and no Referer on a state-changing request → reject.
  return false;
}

export function timingSafeEqual(a: string, b: string): boolean {
  // Constant-time string comparison. Always iterates max-length chars to
  // avoid leaking length information through wall time.
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    const ac = i < a.length ? a.charCodeAt(i) : 0;
    const bc = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ac ^ bc;
  }
  return diff === 0;
}
