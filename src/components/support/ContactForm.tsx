'use client';

import { useState, FormEvent } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [values, setValues] = useState<FormState>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(v: FormState): FormErrors {
    const e: FormErrors = {};
    if (!v.name.trim()) e.name = 'Please enter your name.';
    if (!v.email.trim()) e.email = 'Please enter your email.';
    else if (!EMAIL_RE.test(v.email.trim())) e.email = 'That email doesn’t look right.';
    if (!v.message.trim()) e.message = 'Please write a message.';
    else if (v.message.trim().length < 10) e.message = 'Tell us a bit more — at least 10 characters.';
    return e;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v: FormErrors = validate(values);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    // Stub: replace with API route when backend is ready.
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setSent(true);
    setValues({ name: '', email: '', message: '' });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-charcoal-100 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-charcoal-900 text-white">
          <CheckCircle2 size={22} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-charcoal-900">Message sent</h3>
        <p className="mt-2 text-sm text-charcoal-600">
          Thanks — we’ll get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-medium text-charcoal-900 underline-offset-4 hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-charcoal-100 bg-white p-6 sm:p-8"
    >
      <Field
        id="name"
        label="Name"
        value={values.name}
        error={errors.name}
        onChange={(val) => setValues((s) => ({ ...s, name: val }))}
        placeholder="Your full name"
        autoComplete="name"
      />
      <Field
        id="email"
        label="Email"
        type="email"
        value={values.email}
        error={errors.email}
        onChange={(val) => setValues((s) => ({ ...s, email: val }))}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-charcoal-800">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={values.message}
          onChange={(e) => setValues((s) => ({ ...s, message: e.target.value }))}
          placeholder="How can we help?"
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-charcoal-900 placeholder-charcoal-400 transition focus:outline-none focus:ring-2 focus:ring-charcoal-900/10 ${
            errors.message
              ? 'border-red-400 focus:border-red-500'
              : 'border-charcoal-200 focus:border-charcoal-900'
          }`}
        />
        {errors.message && (
          <p className="mt-1.5 text-xs text-red-600">{errors.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-charcoal-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send message'}
        {!submitting && <Send size={15} />}
      </button>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}

function Field({ id, label, value, onChange, error, type = 'text', placeholder, autoComplete }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-charcoal-900 placeholder-charcoal-400 transition focus:outline-none focus:ring-2 focus:ring-charcoal-900/10 ${
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-charcoal-200 focus:border-charcoal-900'
        }`}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
