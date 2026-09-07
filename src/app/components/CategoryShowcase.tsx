'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchCategories, Category } from '@/lib/supabase/services';
import AppImage from '@/components/ui/AppImage';

function getCategoryImageUrl(categoryName: string): string {
  const name = categoryName?.toLowerCase() || '';
  
  if (name.includes('beef')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80';
  } 
  if (name.includes('pork')) {
    return 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&auto=format&fit=crop&q=80'; // Tamang pork/lechon belly image
  } 
  if (name.includes('chicken')) {
    return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80';
  } 
  if (name.includes('seafood') || name.includes('fish') || name.includes('shrimp')) {
    return 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500&auto=format&fit=crop&q=80';
  } 
  if (name.includes('pasta') || name.includes('noodle') || name.includes('spaghetti')) {
    return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=80'; // Tamang pasta dish image
  } 
  if (name.includes('package') || name.includes('bundle') || name.includes('bilao')) {
    return 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=80';
  } 
  if (name.includes('vegetable') || name.includes('veggie') || name.includes('lumpiang')) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80';
  } 
  if (name.includes('drink') || name.includes('beverage') || name.includes('shake')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80';
  } 
  if (name.includes('dessert') || name.includes('sweet') || name.includes('leche')) {
    return 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80';
  }
  
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80';
}

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
    <section className="bg-[#FDF8F0] py-20 relative overflow-hidden">
      {/* Decorative side accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7B1C2E]" />

      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 relative z-10">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-[#7B1C2E] text-xs font-bold tracking-[0.3em] uppercase mb-2">
              What We Serve
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl font-black leading-tight text-[#2C1810]">
              Browse by<br />
              <span className="text-[#7B1C2E]">Category</span>
            </h2>
          </div>
          <p className="text-[#5C4033] max-w-xs text-sm leading-relaxed font-medium">
            From savory beef and pork trays to indulgent desserts — something for every Filipino celebration.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-3xl h-44 bg-[#e8c4c4]" />
            ))}
          </div>
        )}

        {/* Bento-style category grid */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            {categories?.map((cat, i) => (
              <Link
                key={cat?.id}
                href="/menu-browse-screen"
                className="group relative overflow-hidden rounded-3xl h-44 p-4 flex flex-col justify-end cursor-pointer border-2 border-[#E8D9C4] hover:border-[#7B1C2E] transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Full Background Image */}
                <div className="absolute inset-0 z-0">
                  <AppImage
                    src={getCategoryImageUrl(cat?.name)}
                    alt={cat?.name || 'Category'}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Balanced dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                </div>

                {/* Text Content - Pure White */}
                <div className="relative z-10 text-white">
                  <p className="text-sm font-bold text-white group-hover:text-[#FDF8F0] transition-colors leading-tight drop-shadow-md">
                    {cat?.name}
                  </p>
                  <p className="text-xs font-semibold text-gray-200 mt-0.5 drop-shadow-md">
                    {cat?.itemCount} items
                  </p>
                </div>

                {/* Arrow on hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-10 text-white bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                  <span className="text-xs font-extrabold">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}