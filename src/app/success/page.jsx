import Link from 'next/link';

export default function SuccessPage({ searchParams }) {
  const id = searchParams?.id || '';
  const emailSent = searchParams?.email === 'true';
  const total = searchParams?.total;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="card-elev p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-ink-900">Order received</h1>
        <p className="mt-3 text-ink-500">
          Thanks — your order has been submitted. {emailSent
            ? 'A branded PDF invoice has been emailed to our team and we\'ll be in touch shortly.'
            : 'Note: our confirmation email couldn\'t be sent, but your order is saved. Our team will reach out.'}
        </p>

        <div className="mt-8 grid gap-3 rounded-xl bg-cream p-5 text-left text-sm ring-1 ring-ink-100 sm:grid-cols-2">
          {id && (
            <Info k="Order ID" v={id} />
          )}
          {total && (
            <Info k="Total" v={`$${Number(total).toFixed(2)}`} />
          )}
          <Info k="Status" v={emailSent ? 'Pending — invoice sent' : 'Pending'} />
          <Info k="Next step" v="We'll email you to confirm" />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary">Continue shopping</Link>
          <Link href="/" className="btn-ghost">Back to home</Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        Need help? <Link href="/#faq" className="font-semibold text-gold-700 hover:underline">Read our FAQ</Link>
      </p>
    </div>
  );
}

function Info({ k, v }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">{k}</div>
      <div className="mt-0.5 font-semibold text-ink-900 break-all">{v}</div>
    </div>
  );
}
