'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { useCart } from '@/lib/cartContext';
import { fetchFeaturedMenuItems, MenuItem } from '@/lib/supabase/services';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';

export default function FeaturedItems() {
  const { addItem, openCart } = useCart();
  const [featured, setFeatured] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedMenuItems(4)
      .then(setFeatured)
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  function handleAdd(item: MenuItem) {
    addItem(item);
    toast.success(`${item.name} added to cart!`, {
      description: `₱${item.price.toLocaleString()} — ${item.servingSize}`,
      action: { label: 'View Cart', onClick: openCart },
    });
  }

  const hero = featured[0];
  const rest = featured.slice(1);

  if (loading) {
    return (
      <section className="feat-v2-root py-20 relative overflow-hidden">
        <div className="feat-v2-bg absolute inset-0 pointer-events-none" />
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 relative z-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="feat-v2-eyebrow text-xs font-bold tracking-[0.3em] uppercase mb-2">Most Loved</p>
              <h2 className="font-display text-4xl lg:text-5xl font-black text-black leading-tight">
                Featured <span className="feat-v2-title-accent">Trays</span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse">
            <div className="lg:col-span-5 rounded-3xl h-96" style={{ background: 'var(--muted)' }} />
            <div className="lg:col-span-7 grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-3xl h-64" style={{ background: 'var(--muted)' }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="feat-v2-root py-20 relative overflow-hidden">
      {/* Background texture */}
      <div className="feat-v2-bg absolute inset-0 pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 relative z-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="feat-v2-eyebrow text-xs font-bold tracking-[0.3em] uppercase mb-2">Most Loved</p>
            <h2 className="font-display text-4xl lg:text-5xl font-black text-black leading-tight">
              Featured <span className="feat-v2-title-accent">Trays</span>
            </h2>
          </div>
          <Link
            href="/menu-browse-screen"
            className="hidden sm:flex items-center gap-2 feat-v2-link text-sm font-bold transition-colors"
          >
            View all
            <Icon name="ArrowRightIcon" size={16} />
          </Link>
        </div>

        {/* Asymmetric bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Hero card — large */}
          {hero && (
            <div className="lg:col-span-5 feat-v2-hero-card group rounded-3xl overflow-hidden relative">
              <div className="relative h-72 lg:h-80 overflow-hidden">
                <AppImage
                  src={hero.image}
                  alt={hero.imageAlt}
                  width={480}
                  height={320}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="feat-v2-hero-overlay absolute inset-0" />
                <div className="absolute top-4 left-4">
                  <span className="feat-v2-badge px-3 py-1.5 text-xs font-black rounded-full tracking-wide">
                    ⭐ BESTSELLER
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">{hero.category}</span>
                  <h3 className="font-display text-2xl font-black text-black mt-1 leading-tight">{hero.name}</h3>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{hero.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display text-3xl font-black text-primary tabular-nums">₱{hero.price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">{hero.servingSize}</span>
                  </div>
                  <button
                    onClick={() => handleAdd(hero)}
                    className="feat-v2-add-btn flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm"
                  >
                    <Icon name="PlusIcon" size={15} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right column — 3 smaller cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {rest.map((item, i) => (
              <div
                key={item.id}
                className="feat-v2-small-card group rounded-3xl overflow-hidden flex flex-col"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative h-40 overflow-hidden flex-shrink-0">
                  <AppImage
                    src={item.image}
                    alt={item.imageAlt}
                    width={280}
                    height={160}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="feat-v2-small-overlay absolute inset-0" />
                </div>
                <div className="p-4 flex flex-col flex-1 space-y-3">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">{item.category}</span>
                    <h3 className="font-display text-sm font-bold text-black mt-0.5 leading-snug line-clamp-2">{item.name}</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-black text-primary tabular-nums">₱{item.price.toLocaleString()}</span>
                    <button
                      onClick={() => handleAdd(item)}
                      className="feat-v2-small-add w-8 h-8 rounded-xl flex items-center justify-center"
                    >
                      <Icon name="PlusIcon" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* CTA card */}
            <div className="feat-v2-cta-card rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 cursor-pointer group">
              <div className="feat-v2-cta-icon w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
                🍽️
              </div>
              <div>
                <p className="font-display text-base font-black text-black">22+ More Trays</p>
                <p className="text-xs text-gray-700 mt-1">Explore the full menu</p>
              </div>
              <Link
                href="/menu-browse-screen"
                className="feat-v2-cta-btn px-4 py-2 rounded-xl text-xs font-bold"
              >
                View All →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}