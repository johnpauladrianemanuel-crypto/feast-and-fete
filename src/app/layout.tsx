import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/lib/cartContext';
import PageTransition from '@/components/PageTransition';
import LoadingBar from '@/components/LoadingBar';
import '@/styles/index.css';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Feast & Fête — Filipino Food Tray Pre-Ordering',
  description: 'Order premium Filipino food trays online from Feast & Fête — browse our menu, pre-order for pickup or delivery, and track your order in real time.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${dmSans.variable}`}>
      <body className={dmSans.className}>
        <AuthProvider>
          <CartProvider>
            <LoadingBar />
            <PageTransition>
              {children}
            </PageTransition>
          </CartProvider>
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-3d)',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
</body>
    </html>
  );
}