import Link from 'next/link';

export default function Logo({ variant = 'dark' }) {
  return (
    <Link href="/" className="flex items-baseline gap-1.5 select-none">
      <span className={`text-[20px] font-black tracking-[0.18em] ${variant === 'light' ? 'text-white' : 'text-charcoal-900'}`}>
        MANSA
      </span>
      <span className={`hidden sm:inline text-[9px] font-semibold tracking-[0.35em] uppercase ${variant === 'light' ? 'text-charcoal-400' : 'text-charcoal-500'}`}>
        Electronics
      </span>
    </Link>
  );
}
