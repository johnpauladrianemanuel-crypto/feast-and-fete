'use client';
import React, { useState, useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { MenuItem } from '@/lib/supabase/services';
import { useCart } from '@/lib/cartContext';
import { toast } from 'sonner';
import { MenuItemRatingSummary } from '@/lib/supabase/services';

interface Props {
  item: MenuItem;
  index: number;
  ratingSummary?: MenuItemRatingSummary;
  onOpenDetail?: (item: MenuItem) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  beef: { bg: 'rgba(139,0,0,0.1)', text: '#8B0000' },
  pork: { bg: 'rgba(210,105,30,0.1)', text: '#8B4513' },
  chicken: { bg: 'rgba(212,160,23,0.12)', text: '#8B6914' },
  seafood: { bg: 'rgba(0,105,148,0.1)', text: '#006994' },
  pasta: { bg: 'rgba(180,60,0,0.1)', text: '#8B3A00' },
  vegetables: { bg: 'rgba(34,100,34,0.1)', text: '#1F6B1F' },
  desserts: { bg: 'rgba(180,80,140,0.1)', text: '#8B3A6B' },
  packages: { bg: 'rgba(123,28,46,0.1)', text: '#7B1C2E' },
};

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <svg
            key={star}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill={star <= fullStars ? '#D4A017' : star === fullStars + 1 && hasHalf ? 'url(#half)' : 'none'}
            stroke={star <= fullStars || (star === fullStars + 1 && hasHalf) ? '#D4A017' : '#D1D5DB'}
            strokeWidth="1.5"
          >
            {star === fullStars + 1 && hasHalf && (
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="#D4A017" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

export default function MenuItemCard({ item, index, ratingSummary, onOpenDetail }: Props) {
  const { addItem, openCart } = useCart();
  const [addedPulse, setAddedPulse] = useState(false);
  const [visible, setVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const catColor = CATEGORY_COLORS[item.categorySlug] ?? { bg: 'rgba(100,100,100,0.1)', text: '#555' };

  // Intersection Observer for scroll-triggered entrance
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const delay = Math.min(index * 55, 400);
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  function handleAdd() {
    addItem(item);
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 700);
    toast.success(`${item.name} added!`, {
      description: `₱${item.price.toLocaleString()} — ${item.servingSize}`,
      action: { label: 'View Cart', onClick: openCart },
    });
  }

  const isLowStock = item.stock > 0 && item.stock <= 5;
  const isOutOfStock = item.stock === 0;

  return (
    <div
      ref={cardRef}
      className="bg-card border border-border rounded-2xl overflow-hidden menu-card-3d group flex flex-col cursor-pointer"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.96)',
        transition: `opacity 480ms cubic-bezier(0.22,1,0.36,1), transform 480ms cubic-bezier(0.34,1.56,0.64,1)`,
      }}
      onClick={e => { e.preventDefault(); onOpenDetail?.(item); }}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail?.(item); } }}
      aria-label={`View details for ${item.name}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden flex-shrink-0 bg-muted">
        <AppImage
          src={item.image}
          alt={item.imageAlt}
          width={320}
          height={192}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 350ms ease, transform 500ms ease',
          }}
          onLoad={() => setImageLoaded(true)}
        />
        {/* Shimmer while image loads */}
        {!imageLoaded && (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, var(--muted) 25%, var(--border) 50%, var(--muted) 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeletonPulse 1.4s ease-in-out infinite',
            }}
          />
        )}

        {/* Hover gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 40%, rgba(44,24,16,0.35) 100%)',
            transition: 'opacity 350ms ease',
          }}
        />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className="px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm"
            style={{ background: catColor.bg, color: catColor.text, border: `1px solid ${catColor.text}30` }}
          >
            {item.category}
          </span>
        </div>

        {/* Featured badge */}
        {item.featured && (
          <div className="absolute top-3 right-3">
            <span
              className="px-2 py-1 text-xs font-bold rounded-full"
              style={{
                background: 'rgba(212,160,23,0.92)',
                color: '#2C1810',
                boxShadow: '0 2px 8px rgba(212,160,23,0.4)',
                animation: 'featuredGlow 2.5s ease-in-out infinite',
              }}
            >
              ⭐ Best Seller
            </span>
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center backdrop-blur-sm">
            <span className="px-3 py-1.5 bg-error text-white text-xs font-bold rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div className="flex-1">
          <h3 className="font-display text-base font-bold text-foreground leading-snug line-clamp-2">
            {item.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Rating display */}
        {ratingSummary && ratingSummary.reviewCount > 0 && (
          <StarDisplay rating={ratingSummary.averageRating} count={ratingSummary.reviewCount} />
        )}

        {/* Serving size */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="UsersIcon" size={12} className="text-muted-foreground flex-shrink-0" />
          <span>{item.servingSize}</span>
        </div>

        {/* Low stock warning */}
        {isLowStock && !isOutOfStock && (
          <div
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: 'var(--warning)', animation: 'lowStockPulse 1.8s ease-in-out infinite' }}
          >
            <Icon name="ExclamationTriangleIcon" size={12} />
            Only {item.stock} trays left!
          </div>
        )}

        {/* Price + Add to Cart */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="font-display text-xl font-bold text-primary tabular-nums">
              ₱{item.price.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ tray</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleAdd(); }}
            disabled={isOutOfStock}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed add-cart-btn"
            style={{
              background: addedPulse
                ? 'linear-gradient(135deg, #2D7A4F 0%, #3DA866 100%)'
                : 'linear-gradient(135deg, #7B1C2E 0%, #9B2C3E 100%)',
              color: 'var(--primary-foreground)',
              boxShadow: addedPulse
                ? '0 4px 16px rgba(45,122,79,0.5)'
                : '0 4px 12px rgba(123,28,46,0.3)',
              transform: addedPulse ? 'scale(0.93)' : undefined,
              transition: 'background 250ms ease, box-shadow 250ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
            }}
            aria-label={`Add ${item.name} to cart`}
          >
            <Icon name={addedPulse ? 'CheckIcon' : 'PlusIcon'} size={14} />
            {addedPulse ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}