'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

interface DisplayTestimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatar?: string;
}

const FALLBACK_TESTIMONIALS: DisplayTestimonial[] = [
  {
    id: 'test-001',
    name: 'Sarah Chen',
    role: 'PRODUCT DESIGNER',
    quote: 'The attention to detail in these blocks is insane. The animations are smooth and the code is so clean. Highly recommended for any Pro project.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'test-002',
    name: 'James Wilson',
    role: 'FULLSTACK DEVELOPER',
    quote: "I've tried many UI libraries, but Lightwind is on another level. The 3D components and glassmorphism effects are a game changer for my clients.",
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'test-003',
    name: 'Elena Rodriguez',
    role: 'MARKETING DIRECTOR',
    quote: 'Our landing page conversion rates increased by 40% after switching to Lightwind components. The visual impact is immediate and professional.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'test-004',
    name: 'Alex Rivera',
    role: 'CEO AT TECHFLOW',
    quote: 'Lightwind UI has completely transformed our development workflow. The components are not just beautiful, they are incredibly well-engineered.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
];

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<DisplayTestimonial[]>(FALLBACK_TESTIMONIALS);

  const fetchReviews = useCallback(async () => {
    const supabase = createClient();
    const { data: reviewsData } = await supabase
      .from('item_reviews')
      .select('id, reviewer_name, rating, review_text, created_at')
      .not('review_text', 'is', null)
      .gte('rating', 4)
      .order('created_at', { ascending: false });

    if (reviewsData && reviewsData.length > 0) {
      const realTestimonials: DisplayTestimonial[] = (reviewsData as Review[]).map((r) => ({
        id: r.id,
        name: r.reviewer_name || 'Verified Customer',
        role: 'VERIFIED CUSTOMER',
        quote: r.review_text || '',
        rating: Number(r.rating) || 5,
      }));

      setTestimonials([...realTestimonials, ...FALLBACK_TESTIMONIALS]);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const marqueeItems = [...testimonials, ...testimonials];

  return (
    <section className="py-20 relative overflow-hidden bg-background text-foreground transition-colors duration-300">
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 55s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Eyebrow Label */}
        <div className="flex justify-center mb-3">
          <span className="text-[12px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
            SOCIAL PROOF
          </span>
        </div>

        {/* Title Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-foreground tracking-tight">
            What Our Customers Say
          </h2>
        </div>

        {/* Maroon Stats Banner */}
        <div className="max-w-4xl mx-auto mb-16 bg-[#6B1D2F] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#521624]">
          <div className="grid grid-cols-3 divide-x divide-white/20 text-center">
            {/* Stat 1 */}
            <div className="px-2 sm:px-4">
              <p className="text-2xl sm:text-4xl font-serif font-bold text-[#D4AF37] mb-1">
                500+
              </p>
              <p className="text-[11px] sm:text-xs text-stone-200 uppercase tracking-wider font-medium">
                Happy Families
              </p>
            </div>

            {/* Stat 2 */}
            <div className="px-2 sm:px-4">
              <p className="text-2xl sm:text-4xl font-serif font-bold text-[#D4AF37] mb-1">
                5
              </p>
              <p className="text-[11px] sm:text-xs text-stone-200 uppercase tracking-wider font-medium">
                Average Rating
              </p>
            </div>

            {/* Stat 3 */}
            <div className="px-2 sm:px-4">
              <p className="text-2xl sm:text-4xl font-serif font-bold text-[#D4AF37] mb-1">
                45+
              </p>
              <p className="text-[11px] sm:text-xs text-stone-200 uppercase tracking-wider font-medium">
                Reviews
              </p>
            </div>
          </div>
        </div>

        {/* Infinite Smooth Carousel Area */}
        <div className="relative w-full overflow-hidden">
          {/* Fade overlays sa mga gilid */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Moving Track */}
          <div className="animate-marquee flex gap-5 py-4">
            {marqueeItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex-none w-[300px] sm:w-[340px] bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Stars */}
                  <div className="flex gap-1 text-[#059669] text-sm mb-4">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Author Info & Avatar */}
                <div className="flex items-center gap-3 mt-8 pt-4 border-t border-border">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#059669] flex items-center justify-center text-white text-xs font-bold">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">{item.name}</h3>
                    <p className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase mt-0.5">
                      {item.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}