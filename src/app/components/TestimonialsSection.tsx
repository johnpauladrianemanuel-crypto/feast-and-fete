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

// Fallback static testimonials shown when no Supabase reviews exist yet
const FALLBACK_TESTIMONIALS = [
  { id: 'test-001', name: 'Maria Santos', role: 'Birthday party host', quote: 'The Lechon Kawali tray was the star of my daughter\'s birthday! Crispy skin, juicy meat — guests kept going back for more. Ordering online was so much easier than calling.', rating: 5, location: 'Mandaluyong City' },
  { id: 'test-002', name: 'Roberto Lim', role: 'Christening organizer', quote: 'Feast & Fête delivered everything on time and the Kare-Kare was absolutely authentic. The online ordering system made coordination effortless — no more missed messages!', rating: 5, location: 'Pasig City' },
  { id: 'test-003', name: 'Lorena Mendoza', role: 'Fiesta committee head', quote: 'We ordered the Fiesta Package A for our barangay fiesta and it was a huge hit. The Leche Flan was the best I\'ve ever tasted. Will definitely order again for Christmas!', rating: 5, location: 'Quezon City' },
];

interface DisplayTestimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  location: string;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<DisplayTestimonial[]>(FALLBACK_TESTIMONIALS);
  const [totalReviews, setTotalReviews] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  const fetchReviewsAndStats = useCallback(async () => {
    const supabase = createClient();

    // Fetch live ratings from item_reviews
    const { data: reviewsData } = await supabase
      .from('item_reviews')
      .select('id, reviewer_name, rating, review_text, created_at')
      .not('review_text', 'is', null)
      .gte('rating', 4)
      .order('created_at', { ascending: false })
      .limit(3);

    if (reviewsData && reviewsData.length > 0) {
      const realTestimonials: DisplayTestimonial[] = (reviewsData as Review[]).map((r) => ({
        id: r.id,
        name: r.reviewer_name || 'Verified Customer',
        role: 'Verified Customer',
        quote: r.review_text || '',
        rating: Number(r.rating) || 5,
        location: '',
      }));

      // Merge real reviews with fallbacks so all 3 card slots stay filled
      const combined = [
        ...realTestimonials,
        ...FALLBACK_TESTIMONIALS.slice(realTestimonials.length),
      ].slice(0, 3);

      setTestimonials(combined);
    } else {
      setTestimonials(FALLBACK_TESTIMONIALS);
    }

    // Fetch aggregate statistics
    const { data: statsData } = await supabase
      .from('item_reviews')
      .select('rating');

    if (statsData && statsData.length > 0) {
      const total = statsData.length;
      const sum = statsData.reduce((acc, r) => acc + Number(r.rating || 5), 0);
      const avg = sum / total;
      setTotalReviews(total);
      setAvgRating(Math.round(avg * 10) / 10);
    }
  }, []);

  useEffect(() => {
    fetchReviewsAndStats();

    // Subscribe to realtime database updates
    const supabase = createClient();
    const channel = supabase
      .channel('item_reviews_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'item_reviews' },
        () => {
          fetchReviewsAndStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReviewsAndStats]);

  const featured = testimonials?.[0];
  const rest = testimonials?.slice(1);

  return (
    <section className="testi-v2-root py-24 relative overflow-hidden">
      {/* Decorative large quote mark */}
      <div className="testi-v2-quote-bg absolute top-8 left-8 font-display font-black text-[20rem] leading-none pointer-events-none select-none">
        &ldquo;
      </div>
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="testi-v2-eyebrow text-xs font-bold tracking-[0.3em] uppercase mb-3">Social Proof</p>
          <h2 className="font-display text-4xl lg:text-5xl font-black text-black leading-tight">
            What Our <span className="testi-v2-accent">Customers</span> Say
          </h2>
        </div>

        {/* Asymmetric layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Featured large testimonial */}
          <div className="lg:col-span-6 testi-v2-featured rounded-3xl p-8 lg:p-10 space-y-6">
            {/* Stars */}
            <div className="flex gap-1">
              {Array.from({ length: featured?.rating || 5 })?.map((_, idx) => (
                <span key={idx} className="text-secondary text-xl">★</span>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="font-display text-xl lg:text-2xl font-bold text-black leading-snug">
              &ldquo;{featured?.quote}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4 pt-4 border-t testi-v2-divider">
              <div className="testi-v2-avatar w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-primary-foreground">
                  {featured?.name?.split(' ')?.map(n => n?.[0])?.join('')}
                </span>
              </div>
              <div>
                <p className="font-bold text-black text-sm">{featured?.name}</p>
                <p className="text-xs text-gray-700">
                  {featured?.role}{featured?.location ? ` · ${featured.location}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Right column — stacked smaller cards + stat */}
          <div className="lg:col-span-6 space-y-4">
            {rest?.map((t, i) => (
              <div
                key={t?.id}
                className="testi-v2-card rounded-2xl p-6 space-y-3"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-black leading-relaxed italic flex-1 line-clamp-3">
                    &ldquo;{t?.quote}&rdquo;
                  </p>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {Array.from({ length: t?.rating || 5 })?.map((_, idx) => (
                      <span key={idx} className="text-secondary text-xs">★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="testi-v2-small-avatar w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-primary-foreground">
                      {t?.name?.split(' ')?.map(n => n?.[0])?.join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">{t?.name}</p>
                    <p className="text-xs text-gray-700">
                      {t?.role}{t?.location ? ` · ${t.location}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Trust stat card */}
            <div className="testi-v2-stat-card rounded-2xl p-6 flex items-center gap-6">
              <div className="text-center flex-shrink-0">
                <p className="font-display text-4xl font-black text-primary">500+</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Happy Families</p>
              </div>
              <div className="w-px h-12 testi-v2-stat-divider flex-shrink-0" />
              <div className="text-center flex-shrink-0">
                <p className="font-display text-4xl font-black text-primary">
                  {avgRating !== null ? avgRating : '4.9'}
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Average Rating</p>
              </div>
              <div className="w-px h-12 testi-v2-stat-divider flex-shrink-0" />
              <div className="text-center flex-1">
                <p className="font-display text-4xl font-black text-primary">
                  {totalReviews !== null ? `${totalReviews}+` : '3+'}
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Reviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}