'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchCategories, Category } from '@/lib/supabase/services';

export default function CategoryShowcase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="cat-v2-root py-20 relative overflow-hidden">
      {/* Decorative side accent */}
      <div className="cat-v2-accent absolute left-0 top-0 bottom-0 w-1" />

      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 relative z-10">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="cat-v2-eyebrow text-xs font-bold tracking-[0.3em] uppercase mb-2">What We Serve</p>
            <h2 className="cat-v2-title font-display text-4xl lg:text-5xl font-black leading-tight">
              Browse by<br />
              <span className="cat-v2-title-accent">Category</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
            From savory beef and pork trays to indulgent desserts — something for every Filipino celebration.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="rounded-3xl h-28" style={{ background: 'var(--muted)' }} />
            ))}
          </div>
        )}

        {/* Bento-style category grid — varied sizes */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            {categories?.map((cat, i) => (
              <Link
                key={cat?.id}
                href="/menu-browse-screen"
                className={`cat-v2-card group relative overflow-hidden rounded-3xl p-5 flex flex-col gap-3 cursor-pointer ${
                  i === 0 ? 'sm:col-span-2 sm:row-span-1' : ''
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Background glow on hover */}
                <div className="cat-v2-card-glow absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Icon */}
                <div className="cat-v2-icon w-12 h-12 rounded-2xl flex items-center justify-center text-2xl relative z-10">
                  {cat?.icon}
                </div>

                {/* Text */}
                <div className="relative z-10">
                  <p className="text-sm font-bold text-black group-hover:text-primary transition-colors leading-tight">{cat?.name}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{cat?.itemCount} items</p>
                </div>

                {/* Arrow on hover */}
                <div className="cat-v2-arrow absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                  <span className="text-primary text-sm font-bold">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}