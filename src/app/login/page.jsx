'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin';

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });

      if (res.ok) {
        // Cookie is now set by the server. Hard navigation guarantees the
        // server layout sees it.
        window.location.href = next.startsWith('/') ? next : '/admin';
        return;
      }

      if (res.status === 429) {
        setError('Too many attempts. Try again in a few minutes.');
      } else {
        setError('Invalid credentials. Access denied.');
      }
    } catch {
      setError('Sign-in failed. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
            <Lock size={22} className="text-charcoal-900" />
          </div>
          <p className="text-base font-black tracking-[0.22em] text-white">MANSA</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-charcoal-500">
            Admin Access
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-charcoal-800 bg-charcoal-900 p-6 shadow-2xl"
        >
          <h1 className="text-lg font-bold text-white">Sign in</h1>
          <p className="mt-1 text-xs text-charcoal-400">
            Restricted area. Authorized personnel only.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                Admin ID
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                autoFocus
                maxLength={64}
                className="w-full rounded-lg border border-charcoal-700 bg-charcoal-950 px-3.5 py-2.5 text-sm text-white placeholder-charcoal-600 focus:border-white focus:outline-none"
                placeholder="Enter admin ID"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  maxLength={256}
                  className="w-full rounded-lg border border-charcoal-700 bg-charcoal-950 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-charcoal-600 focus:border-white focus:outline-none"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-charcoal-500 hover:text-white"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-white py-2.5 text-sm font-bold text-charcoal-900 transition hover:bg-charcoal-100 disabled:opacity-60"
            >
              {submitting ? 'Verifying…' : 'Sign in'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] text-charcoal-600">
          <Link href="/" className="hover:text-charcoal-400">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-charcoal-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-charcoal-700 border-t-white" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
