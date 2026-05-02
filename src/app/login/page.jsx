'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin';
  const errorParam = params.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabaseConfigured =
    typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!supabaseConfigured) {
      setError('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.');
      return;
    }
    setSubmitting(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) {
        setError(authErr.message);
        setSubmitting(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Sign-in failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-extrabold">Admin sign-in</h1>
      <p className="mt-1 text-sm text-ink-500">
        Restricted to authorized staff. Customers don't need an account.
      </p>

      {errorParam === 'unauthorized' && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Your account doesn't have admin or staff access.
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-ink-500">Email</span>
          <input
            type="email"
            className="input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-ink-500">Password</span>
          <input
            type="password"
            className="input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
        )}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-xs text-ink-400">
        <Link href="/" className="hover:text-ink-700">← Back to store</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-4 py-20">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
