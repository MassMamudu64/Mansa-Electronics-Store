import Link from 'next/link';
import Image from 'next/image';

// brand/mansa-logo.png is copied to /public/mansa-logo.png so Next can serve it.
const LOGO_SRC = '/mansa-logo.png';
const LOGO_W = 1536;
const LOGO_H = 1024;

/**
 * variant="dark"  → logo on light surfaces (header)
 * variant="light" → logo on espresso surfaces (footer): wrapped in a white chip,
 *                    because the source PNG has a white (opaque) background.
 */
export default function Logo({ variant = 'dark', className = '' }) {
  const img = (
    <Image
      src={LOGO_SRC}
      width={LOGO_W}
      height={LOGO_H}
      alt="Mansa Electronics — Technology, Quality, Trust"
      priority
      className="h-10 w-auto md:h-11"
    />
  );

  return (
    <Link href="/" className={`inline-flex select-none items-center ${className}`} aria-label="Mansa Electronics home">
      {variant === 'light' ? (
        <span className="inline-block rounded-xl bg-white p-2 shadow-card">{img}</span>
      ) : (
        img
      )}
    </Link>
  );
}
