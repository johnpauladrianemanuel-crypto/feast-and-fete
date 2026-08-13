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

  // Checks both camelCase (isActive) and snake_case (is_active) from Supabase
  const rawIsActive = item.isActive ?? (item as { is_active?: boolean }).is_active;
  const isInactive = rawIsActive === false;

  // Extract deactivation reason from item (supporting both camelCase and snake_case)
  const deactivationReason =
    (item as { deactivationReason?: string; deactivation_reason?: string; unavailable_reason?: string; unavailableReason?: string }).deactivationReason ??
    (item as { deactivationReason?: string; deactivation_reason?: string; unavailable_reason?: string; unavailableReason?: string }).deactivation_reason ??
    (item as { deactivationReason?: string; deactivation_reason?: string; unavailable_reason?: string; unavailableReason?: string }).unavailable_reason ??
    (item as { deactivationReason?: string; deactivation_reason?: string; unavailable_reason?: string; unavailableReason?: string }).unavailableReason;

  const isLowStock = item.stock > 0 && item.stock <= 5;
  const isOutOfStock = item.stock === 0;

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

  function handleAdd(e?: React.MouseEvent) {
    if (e) e.stopPropagation();

    if (isInactive) {
      toast.error('Temporarily Unavailable', {
        description: deactivationReason || 'This product is currently not available for order.',
      });
      return;
    }

    addItem(item);
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 700);
    toast.success(`${item.name} added!`, {
      description: `₱${item.price.toLocaleString()} — ${item.servingSize}`,
      action: { label: 'View Cart', onClick: openCart },
    });
  }

  function handleCardClick(e: React.MouseEvent) {
    e.preventDefault();
    if (isInactive) {
      toast.error('Temporarily Unavailable', {
        description: deactivationReason || 'This product is currently not available for order.',
      });
      return;
    }
    onOpenDetail?.(item);
  }

  return (
    <div
      ref={cardRef}
      className={`bg-card border rounded-2xl overflow-hidden menu-card-3d group flex flex-col ${
        isInactive ? 'cursor-not-allowed select-none border-stone-800' : 'border-border cursor-pointer'
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.96)',
        transition: `opacity 480ms cubic-bezier(0.22,1,0.36,1), transform 480ms cubic-bezier(0.34,1.56,0.64,1)`,
        background: isInactive ? '#0F0B08' : undefined,
      }}
      onClick={handleCardClick}
      role="button"
      tabIndex={isInactive ? -1 : 0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isInactive) {
            toast.error('Temporarily Unavailable', {
              description: deactivationReason || 'This product is currently not available for order.',
            });
            return;
          }
          onOpenDetail?.(item);
        }
      }}
      aria-label={`View details for ${item.name}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden flex-shrink-0 bg-muted">
        <AppImage
          src={item.image}
          alt={item.imageAlt}
          width={320}
          height={192}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isInactive ? 'filter grayscale contrast-125 brightness-30 blur-[2px]' : 'group-hover:scale-108'
          }`}
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 350ms ease, transform 500ms ease, filter 350ms ease',
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

        {/* Dark overlay gradient for deactivated item */}
        {isInactive && (
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(10, 5, 3, 0.75)' }}
          />
        )}

        {/* Hover gradient overlay */}
        {!isInactive && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 40%, rgba(44,24,16,0.35) 100%)',
              transition: 'opacity 350ms ease',
            }}
          />
        )}

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
        {item.featured && !isInactive && (
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

        {/* Temporarily Unavailable badge overlay */}
        {isInactive && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-950/90 text-red-200 border border-red-800/50 shadow-md backdrop-blur-sm flex items-center gap-1">
              <Icon name="ExclamationTriangleIcon" size={12} className="text-red-400" />
              Unavailable
            </span>
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && !isInactive && (
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
          <h3 className={`font-display text-base font-bold leading-snug line-clamp-2 ${isInactive ? 'text-stone-400' : 'text-foreground'}`}>
            {item.name}
          </h3>
          <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${isInactive ? 'text-stone-500' : 'text-muted-foreground'}`}>
            {item.description}
          </p>
        </div>

        {/* Deactivation reason banner when inactive */}
        {isInactive && (
          <div className="p-3 rounded-xl border border-red-900/40 bg-stone-950/90 backdrop-blur-sm space-y-1">
            <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs">
              <Icon name="ExclamationCircleIcon" size={15} className="shrink-0" />
              <span>This Item is not available right now</span>
            </div>
            {deactivationReason ? (
              <p className="text-xs text-stone-300 italic pl-5">
                Reason: {deactivationReason}
              </p>
            ) : (
              <p className="text-xs text-stone-400 italic pl-5">
                Reason: Temporarily unavailable
              </p>
            )}
          </div>
        )}

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
        {isLowStock && !isOutOfStock && !isInactive && (
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
            <span className={`font-display text-xl font-bold tabular-nums ${isInactive ? 'text-stone-500' : 'text-primary'}`}>
              ₱{item.price.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ tray</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={isInactive || isOutOfStock}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${
              isInactive
                ? 'bg-stone-900/90 text-stone-500 border border-stone-800/60 cursor-not-allowed opacity-80'
                : 'disabled:opacity-40 disabled:cursor-not-allowed add-cart-btn'
            }`}
            style={{
              background: isInactive
                ? undefined
                : addedPulse
                ? 'linear-gradient(135deg, #2D7A4F 0%, #3DA866 100%)'
                : 'linear-gradient(135deg, #7B1C2E 0%, #9B2C3E 100%)',
              color: isInactive ? undefined : 'var(--primary-foreground)',
              boxShadow: isInactive
                ? 'none'
                : addedPulse
                ? '0 4px 16px rgba(45,122,79,0.5)'
                : '0 4px 12px rgba(123,28,46,0.3)',
              transform: addedPulse ? 'scale(0.93)' : undefined,
              transition: 'background 250ms ease, box-shadow 250ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
            }}
            aria-label={`Add ${item.name} to cart`}
          >
            <Icon name={isInactive ? 'ExclamationTriangleIcon' : addedPulse ? 'CheckIcon' : 'PlusIcon'} size={14} />
            {isInactive ? 'Unavailable' : addedPulse ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}