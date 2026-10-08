import React, { ReactNode } from 'react';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import LandingFooter from '@/app/components/LandingFooter';

interface InfoPageLayoutProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children: ReactNode;
}

export default function InfoPageLayout({
  eyebrow,
  title,
  description,
  children,
}: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />
      <main>
        <section className="relative overflow-hidden bg-[#2C1810]">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative mx-auto max-w-screen-2xl px-4 py-16 sm:py-20 lg:px-8 xl:px-10 2xl:px-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">{eyebrow}</p>
            <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
              {description}
            </p>
          </div>
        </section>
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
