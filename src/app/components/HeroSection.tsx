'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

const slides = [
  {
    id: 0,
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_1b8f554d2-1773070447030.png",
    alt: "Filipino food spread"
  },
  {
    id: 1,
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_1ae88ec9c-1782976378403.png",
    alt: "Chicken Inasal"
  },
  {
    id: 2,
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_181a642d3-1768366714992.png",
    alt: "Dessert tray"
  }
];

export default function HeroSection() {
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000); // Magpapalit bawat 4 na segundo
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-v2-root relative overflow-hidden min-h-screen flex items-center w-full -mt-16 pt-16">
      
      {/* BACKGROUND WALL SLIDESHOW: Lahat ng images ay nandito na, opacity lang ang nagpapalit */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <AppImage
              src={slide.src}
              alt={slide.alt}
              fill
              className="w-full h-full object-cover"
              priority
            />
          </div>
        ))}
        {/* Dark Overlay para lumutang at mabasa nang maayos ang text */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] z-10" />
      </div>

      {/* Animated noise grain overlay kung meron man sa styles mo */}
      <div className="hero-v2-grain absolute inset-0 pointer-events-none z-15" />

      {/* CONTENT: Eksaktong kopya ng iyong mga letra, buttons, at stats layout */}
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-20 lg:py-0 relative z-20 w-full">
        <div className="max-w-3xl space-y-8 py-20 lg:py-32">
          
          {/* Eyebrow pill */}
          <div className="hero-v2-pill inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Pre-orders open · July 2026
          </div>

          {/* Headline */}
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
            
            {!user && (
              <Link
                href="/sign-up-login-screen"
                className="hero-v2-cta-ghost inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm text-white">
                <Icon name="UserPlusIcon" size={17} />
                Create Account
              </Link>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
            {[
              { value: '1,200+', label: 'Orders this month' },
              { value: '4.9★', label: 'Customer rating' },
              { value: '8', label: 'Menu categories' }
            ].map((stat) => (
              <div key={stat.label} className="space-y-0.5">
                <p className="text-xl font-black text-secondary tabular-nums">{stat.value}</p>
                <p className="text-xs text-white/40 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

    </section>
  );
}