'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

export default function HeroSection() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!parallaxRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 10;
      parallaxRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="hero-v2-root relative overflow-hidden min-h-screen flex items-center">
      {/* Animated noise grain overlay */}
      <div className="hero-v2-grain absolute inset-0 pointer-events-none z-0" />

      {/* Large diagonal gold slash accent */}
      <div className="hero-v2-slash absolute pointer-events-none" />

      {/* Floating circles */}
      <div className="hero-v2-circle-1 absolute rounded-full pointer-events-none" />
      <div className="hero-v2-circle-2 absolute rounded-full pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-20 lg:py-0 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center min-h-screen">

          {/* LEFT COLUMN — Copy */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-8 py-20 lg:py-32">
            {/* Eyebrow pill */}
            <div className="hero-v2-pill inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Pre-orders open · July 2026
            </div>

            {/* Headline — stacked, large */}
            <div className="space-y-1">
              <p className="hero-v2-overline text-sm font-bold tracking-[0.3em] uppercase">Feast & Fête</p>
              <h1 className="hero-v2-headline font-display leading-[0.95] tracking-tight">
                <span className="block text-white">Filipino</span>
                <span className="block hero-v2-gold-word">Food Trays</span>
                <span className="block text-white/90 text-4xl lg:text-5xl xl:text-6xl mt-2">for Every Feast</span>
              </h1>
            </div>

            <p className="text-white/55 text-base lg:text-lg leading-relaxed max-w-md">
              Premium catering for birthdays, christenings, fiestas & family gatherings — delivered across Metro Manila.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/menu-browse-screen"
                className="hero-v2-cta-primary inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm">
                
                <Icon name="BookOpenIcon" size={17} />
                Browse Menu
              </Link>
              <Link
                href="/sign-up-login-screen"
                className="hero-v2-cta-ghost inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm text-white">
                
                <Icon name="UserPlusIcon" size={17} />
                Create Account
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
              {[
              { value: '1,200+', label: 'Orders this month' },
              { value: '4.9★', label: 'Customer rating' },
              { value: '8', label: 'Menu categories' }].
              map((stat) =>
              <div key={stat.label} className="space-y-0.5">
                  <p className="text-xl font-black text-secondary tabular-nums">{stat.value}</p>
                  <p className="text-xs text-white/40 font-medium">{stat.label}</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Image collage */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 relative h-screen">
            {/* Parallax image group */}
            <div ref={parallaxRef} className="absolute inset-0 transition-transform duration-75 ease-out">
              {/* Main large image */}
              <div className="hero-v2-img-main absolute">
                <AppImage
                  src="https://img.rocket.new/generatedImages/rocket_gen_img_1b8f554d2-1773070447030.png"
                  alt="Lavish Filipino food tray spread with lechon kawali, kare-kare and various celebration dishes"
                  width={520}
                  height={420}
                  className="w-full h-full object-cover"
                  priority />
                
                <div className="hero-v2-img-main-overlay absolute inset-0" />
              </div>

              {/* Secondary image — top right */}
              <div className="hero-v2-img-secondary absolute">
                <AppImage
                  src="https://img.rocket.new/generatedImages/rocket_gen_img_1ae88ec9c-1782976378403.png"
                  alt="Chicken Inasal grilled tray with golden crispy skin"
                  width={240}
                  height={200}
                  className="w-full h-full object-cover" />
                
              </div>

              {/* Tertiary image — bottom left */}
              <div className="hero-v2-img-tertiary absolute">
                <AppImage
                  src="https://img.rocket.new/generatedImages/rocket_gen_img_181a642d3-1768366714992.png"
                  alt="Filipino dessert tray with biko and leche flan"
                  width={200}
                  height={160}
                  className="w-full h-full object-cover" />
                
              </div>
            </div>

            {/* Floating card — delivery badge */}
            <div className="hero-v2-float-card-1 absolute z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="TruckIcon" size={18} className="text-secondary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Metro Manila Delivery</p>
                  <p className="text-xs text-white/50">Order by 12 noon daily</p>
                </div>
              </div>
            </div>

            {/* Floating card — rating */}
            <div className="hero-v2-float-card-2 absolute z-20">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) =>
                  <span key={s} className="text-secondary text-sm">★</span>
                  )}
                </div>
                <span className="text-white font-bold text-sm">4.9</span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">500+ happy customers</p>
            </div>

            {/* Floating card — GCash */}
            <div className="hero-v2-float-card-3 absolute z-20">
              <div className="flex items-center gap-2">
                <Icon name="ShieldCheckIcon" size={16} className="text-secondary" />
                <span className="text-xs font-bold text-white">Secure GCash Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40">
        <span className="text-white text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white to-transparent" />
      </div>
    </section>);

}