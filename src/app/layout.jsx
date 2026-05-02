import './globals.css';
import { Toaster } from 'sonner';
import StoreShell from '@/components/StoreShell';
import QueryProvider from '@/providers/QueryProvider';

export const metadata = {
  title: 'Mansa Electronics — Premium Mobile Accessories',
  description:
    'Smartphones, chargers, audio accessories, cases, cables, and power banks. Shop Mansa Electronics for premium mobile tech.',
  openGraph: {
    title: 'Mansa Electronics',
    description: 'Premium mobile electronics and accessories.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-charcoal-900 antialiased">
        <QueryProvider>
          <StoreShell>{children}</StoreShell>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
