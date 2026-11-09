'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fetchMenuItemReviews, ItemReview } from '@/lib/supabase/services';

export default function DishReviews({ menuItemId }: { menuItemId: string }) {
  const [reviews, setReviews] = useState<ItemReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [canGoPrevious, setCanGoPrevious] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const trackRef = useRef<HTMLUListElement>(null);
  const firstCopyRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    let active = true;
    setReviews([]);
    setError('');
    setLoading(true);
    setPaused(false);
    fetchMenuItemReviews(menuItemId)
      .then((result) => { if (active) setReviews(result); })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load reviews.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [menuItemId, reload]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const updateButtons = () => {
      setCanGoPrevious(track.scrollLeft > 1);
      setCanGoNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
    };
    updateButtons();
    track.addEventListener('scroll', updateButtons, { passive: true });
    const observer = new ResizeObserver(updateButtons);
    observer.observe(track);
    return () => {
      track.removeEventListener('scroll', updateButtons);
      observer.disconnect();
    };
  }, [reviews, loading]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const firstCopy = firstCopyRef.current;
    if (!track || !firstCopy || loading || paused || reducedMotion || reviews.length < 2) return;

    let frame = 0;
    let previousTime: number | undefined;
    let position = track.scrollLeft;
    const animate = (time: number) => {
      if (previousTime !== undefined && !document.hidden) {
        const firstCard = track.firstElementChild;
        const cycleWidth = firstCard instanceof HTMLElement ? firstCopy.offsetLeft - firstCard.offsetLeft : 0;
        if (cycleWidth > 0) {
          position = (position + Math.min(time - previousTime, 100) * 0.035) % cycleWidth;
          track.scrollLeft = position;
        }
      }
      previousTime = time;
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [reviews, loading, paused, reducedMotion]);

  function slide(direction: -1 | 1) {
    setPaused(true);
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !card) return;
    const distance = card.getBoundingClientRect().width + 12;
    track.scrollBy({ left: direction * distance, behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  return (
    <section aria-labelledby="dish-reviews-heading" className="border-t border-stone-200 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 id="dish-reviews-heading" className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          Customer reviews
        </h3>
        {reviews.length > 1 && (
          <div className="flex gap-2">
            {!reducedMotion && (
              <button type="button" onClick={() => setPaused((value) => !value)} className="rounded-full border border-stone-300 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-100">
                {paused ? 'Play' : 'Pause'}
                <span className="sr-only"> automatic review scrolling</span>
              </button>
            )}
            <button type="button" aria-label="Previous reviews" onClick={() => slide(-1)} disabled={!canGoPrevious} className="h-8 w-8 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40">
              <span aria-hidden="true">‹</span>
            </button>
            <button type="button" aria-label="Next reviews" onClick={() => slide(1)} disabled={!canGoNext} className="h-8 w-8 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40">
              <span aria-hidden="true">›</span>
            </button>
          </div>
        )}
      </div>
      {loading ? (
        <p role="status" className="mt-3 text-sm text-stone-500">Loading reviews…</p>
      ) : error ? (
        <div role="alert" className="mt-3 text-sm text-red-700">
          <p>Could not load reviews: {error}</p>
          <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-1 font-semibold underline">
            Try again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">No reviews for this dish yet.</p>
      ) : (
        <ul ref={trackRef} aria-label="Dish reviews" tabIndex={0} onPointerDown={() => setPaused(true)} onFocus={() => setPaused(true)} className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          {[...reviews, ...(reviews.length > 1 && !reducedMotion ? reviews : [])].map((review, index) => (
            <li key={`${review.id}-${index}`} ref={index === reviews.length ? firstCopyRef : undefined} aria-hidden={index >= reviews.length ? true : undefined} className="w-[85%] sm:w-[70%] flex-none rounded-xl border border-stone-200 bg-stone-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-stone-900">{review.reviewerName}</span>
                <span className="text-sm font-semibold text-amber-700" aria-label={`${review.rating} out of 5 stars`}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              {review.reviewText && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-700">{review.reviewText}</p>}
              <p className="mt-2 text-xs text-stone-500">
                {new Date(review.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
