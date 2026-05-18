'use client';

import { usePathname } from 'next/navigation';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Footer from './Footer';
import AddToCartPopup from './cart/AddToCartPopup';

const INTERNAL_PREFIXES = ['/admin', '/inventory'];

export default function StoreShell({ children }) {
  const pathname = usePathname();
  const isInternal = INTERNAL_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isInternal) {
    return <>{children}</>;
  }

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <AddToCartPopup autoCloseMs={4000} />
    </>
  );
}
