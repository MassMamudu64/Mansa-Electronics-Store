import Link from 'next/link';

export default function Logo({ dark = false }) {
  const brand = dark ? 'text-white' : 'text-ink-900';
  return (
    <Link href="/" className="flex items-baseline gap-2">
      <span className={`text-[22px] font-black tracking-[0.22em] ${brand}`}>MANSA</span>
      <span className="hidden sm:inline text-[10px] font-semibold tracking-[0.3em] text-gold-600 uppercase">Electronics</span>
    </Link>
  );
}
