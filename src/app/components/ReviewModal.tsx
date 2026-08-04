'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { submitItemReview } from '@/lib/supabase/services';

interface ReviewableItem {
  menuItemId: string;
  menuItemName: string;
  menuItemImage?: string;
  menuItemImageAlt?: string;
  orderId?: string;
}

interface Props {
  items: ReviewableItem[];
  reviewerName: string;
  userId?: string | null;
  guestProfileId?: string | null;
  onClose: () => void;
  onComplete?: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill={(hovered || value) >= star ? '#D4A017' : 'none'}
            stroke={(hovered || value) >= star ? '#D4A017' : '#9CA3AF'}
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function ReviewModal({ items, reviewerName, userId, guestProfileId, onClose, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [allDone, setAllDone] = useState(false);

  const currentItem = items[currentIndex];
  const currentRating = ratings[currentItem?.menuItemId] ?? 0;
  const currentReview = reviews[currentItem?.menuItemId] ?? '';
  const skippedAll = currentIndex >= items.length;

  async function handleSubmitCurrent() {
    if (!currentItem) return;
    if (currentRating === 0) {
      setError('Please select a star rating before submitting.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await submitItemReview({
        menuItemId: currentItem.menuItemId,
        orderId: currentItem.orderId ?? null,
        userId: userId ?? null,
        guestProfileId: guestProfileId ?? null,
        reviewerName,
        rating: currentRating,
        reviewText: currentReview.trim() || undefined,
      });
      setSubmitted(prev => new Set(prev).add(currentItem.menuItemId));
      if (currentIndex + 1 >= items.length) {
        setAllDone(true);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch {
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    setError('');
    if (currentIndex + 1 >= items.length) {
      setAllDone(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }

  function handleClose() {
    onComplete?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <div
        className="bg-card rounded-2xl border border-border w-full max-w-md"
        style={{ boxShadow: 'var(--shadow-3d)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Rate Your Order</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allDone ? 'Thank you for your feedback!' : `Item ${Math.min(currentIndex + 1, items.length)} of ${items.length}`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            aria-label="Close review modal"
          >
            <Icon name="XMarkIcon" size={16} className="text-foreground" />
          </button>
        </div>

        {/* All done state */}
        {allDone ? (
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
              <Icon name="StarIcon" size={28} className="text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">Reviews Submitted!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your feedback helps us improve our food and service. Thank you, {reviewerName}!
            </p>
            <div className="flex items-center justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map(s => (
                <svg key={s} width="22" height="22" viewBox="0 0 24 24" fill="#D4A017" stroke="#D4A017" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <button
              onClick={handleClose}
              className="w-full py-3 gradient-brand text-primary-foreground font-semibold rounded-xl btn-3d"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="px-6 py-5">
            {/* Item info */}
            <div className="flex items-center gap-4 mb-5">
              {currentItem.menuItemImage ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                  <AppImage
                    src={currentItem.menuItemImage}
                    alt={currentItem.menuItemImageAlt || currentItem.menuItemName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon name="PhotoIcon" size={24} className="text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground text-base leading-snug">{currentItem.menuItemName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">How would you rate this item?</p>
              </div>
            </div>

            {/* Star rating */}
            <div className="mb-2">
              <StarRating
                value={currentRating}
                onChange={v => {
                  setRatings(prev => ({ ...prev, [currentItem.menuItemId]: v }));
                  setError('');
                }}
              />
              {currentRating > 0 && (
                <p className="text-sm font-semibold mt-1.5" style={{ color: 'var(--primary)' }}>
                  {RATING_LABELS[currentRating]}
                </p>
              )}
            </div>

            {/* Review text */}
            <div className="mb-4 mt-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Write a review <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <textarea
                value={currentReview}
                onChange={e => setReviews(prev => ({ ...prev, [currentItem.menuItemId]: e.target.value }))}
                rows={3}
                placeholder="Share your thoughts about this dish..."
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>

            {error && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                <Icon name="ExclamationCircleIcon" size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Progress dots */}
            {items.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {items.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all ${
                      i === currentIndex
                        ? 'w-4 h-2 bg-primary'
                        : submitted.has(items[i].menuItemId)
                        ? 'w-2 h-2 bg-primary/50' :'w-2 h-2 bg-border'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                disabled={submitting}
                className="flex-1 py-2.5 border border-border bg-card text-foreground text-sm font-medium rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitCurrent}
                disabled={submitting || currentRating === 0}
                className="flex-1 py-2.5 gradient-brand text-primary-foreground text-sm font-semibold rounded-xl btn-3d transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Icon name="StarIcon" size={14} />
                )}
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
