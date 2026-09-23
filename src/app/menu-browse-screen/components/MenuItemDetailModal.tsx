'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { MenuItem } from '@/lib/supabase/services';
import { useCart } from '@/lib/cartContext';
import { toast } from 'sonner';
import { MenuItemRatingSummary } from '@/lib/supabase/services';

interface Props {
  item: MenuItem | null;
  onClose: () => void;
  ratingSummary?: MenuItemRatingSummary;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  beef: { bg: 'rgba(139,0,0,0.12)', text: '#8B0000' },
  pork: { bg: 'rgba(210,105,30,0.12)', text: '#8B4513' },
  chicken: { bg: 'rgba(212,160,23,0.14)', text: '#8B6914' },
  seafood: { bg: 'rgba(0,105,148,0.12)', text: '#006994' },
  pasta: { bg: 'rgba(180,60,0,0.12)', text: '#8B3A00' },
  vegetables: { bg: 'rgba(34,100,34,0.12)', text: '#1F6B1F' },
  desserts: { bg: 'rgba(180,80,140,0.12)', text: '#8B3A6B' },
  packages: { bg: 'rgba(123,28,46,0.12)', text: '#7B1C2E' },
};

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <svg key={star} width="16" height="16" viewBox="0 0 24 24"
            fill={star <= fullStars ? '#D4A017' : star === fullStars + 1 && hasHalf ? 'url(#half2)' : 'none'}
            stroke={star <= fullStars || (star === fullStars + 1 && hasHalf) ? '#D4A017' : '#D1D5DB'}
            strokeWidth="1.5">
            {star === fullStars + 1 && hasHalf && (
              <defs>
                <linearGradient id="half2">
                  <stop offset="50%" stopColor="#D4A017" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">({count} reviews)</span>
    </div>
  );
}

function ModalContent({ item, onClose, ratingSummary }: Props & { item: MenuItem }) {
  const { addItem, openCart } = useCart();
  const [addedPulse, setAddedPulse] = useState(false);
  const [visible, setVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [orderNote, setOrderNote] = useState('');
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    item.customizations?.forEach(c => { defaults[c.id] = c.defaultValue; });
    return defaults;
  });

  useEffect(() => {
    setQuantity(1);
    setOrderNote('');
    const newDefaults: Record<string, string> = {};
    item.customizations?.forEach(c => { newDefaults[c.id] = c.defaultValue; });
    setSelectedCustomizations(newDefaults);
    
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setVisible(true);
      });
    });
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      document.body.style.overflow = '';
    };
  }, [item.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const catColor = CATEGORY_COLORS[item.categorySlug] ?? { bg: 'rgba(100,100,100,0.1)', text: '#555' };
  const isOutOfStock = item.stock <= 0;
  const isLowStock = item.stock > 0 && item.stock <= 5;

  function handleAdd() {
    const customizationsToSave = Object.keys(selectedCustomizations).length > 0 ? selectedCustomizations : undefined;
    for (let i = 0; i < quantity; i++) addItem(item, customizationsToSave, orderNote);
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 800);
    toast.success(`${quantity}× ${item.name} added!`, {
      description: `₱${(item.price * quantity).toLocaleString()} total`,
      action: { label: 'View Cart', onClick: openCart },
    });
  }

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-end sm:place-items-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[580px] max-h-[90vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(100%) sm:translateY(40px) scale(0.95)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Indicator Bar */}
        <div className="sm:hidden w-full flex justify-center pt-2 pb-1 bg-white">
          <div className="w-12 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto w-full bg-white">
          
          {/* Header Image Area */}
          <div className="relative w-full h-[240px] sm:h-[290px] bg-white flex-shrink-0">
            <AppImage
              src={item.image}
              alt={item.imageAlt || item.name}
              width={580}
              height={290}
              className="w-full h-full object-cover"
            />

            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.85) 80%, rgba(255,255,255,1) 100%)',
              }}
            />

            {/* Badges on Top Left */}
            <div className="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
              <span
                className="px-3 py-1 text-xs font-semibold rounded-full bg-white/95 backdrop-blur-md shadow-sm"
                style={{ color: catColor.text }}
              >
                {item.category}
              </span>

              {item.featured && (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-400 text-stone-900 shadow-md">
                  ⭐ Best Seller
                </span>
              )}

              {isLowStock && (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500 text-black shadow-md">
                  🔥 Only {item.stock} left!
                </span>
              )}

              {isOutOfStock && (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-600 text-white shadow-md">
                  Unavailable
                </span>
              )}
            </div>

            {/* Close Button on Top Right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full flex items-center justify-center bg-black/50 text-white backdrop-blur-md border border-white/20 transition-transform active:scale-95 hover:scale-105"
              aria-label="Close modal"
            >
              <Icon name="XMarkIcon" size={18} />
            </button>

            {/* Dish Title & Price */}
            <div className="absolute bottom-2 left-6 right-6 z-20 flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 leading-tight">
                {item.name}
              </h2>
              <div className="text-right flex-shrink-0">
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
                  ₱{item.price.toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-stone-600">per tray</div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 pt-4 space-y-5 bg-white -mt-0.5">
            {ratingSummary && ratingSummary.reviewCount > 0 && (
              <StarDisplay rating={ratingSummary.averageRating} count={ratingSummary.reviewCount} />
            )}

            <div className="flex items-center justify-between text-sm text-stone-700">
              <div className="flex items-center gap-2">
                <Icon name="UsersIcon" size={16} />
                <span>{item.servingSize}</span>
              </div>
              <div className={`font-semibold ${item.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                Available Stock: {item.stock}
              </div>
            </div>

            <hr className="border-stone-200" />

            <div>
              <h3 className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wider">
                About this dish
              </h3>
              <p className="text-sm text-stone-800 leading-relaxed">
                {item.description}
              </p>
            </div>

            {item.ingredients && (
              <div>
                <h3 className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wider">
                  Ingredients
                </h3>
                <p className="text-sm text-stone-800 leading-relaxed">
                  {item.ingredients}
                </p>
              </div>
            )}

            {/* Customizations */}
            {item.customizations && item.customizations.length > 0 && (
              <>
                <hr className="border-stone-200" />
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    I-Customize ang Order Mo
                  </h3>
                  {item.customizations.map(customization => (
                    <div key={customization.id} className="space-y-2">
                      <label className="text-xs font-semibold text-stone-800">
                        {customization.label}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {customization.options.map(option => {
                          const isSelected = selectedCustomizations[customization.id] === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => setSelectedCustomizations(prev => ({ ...prev, [customization.id]: option.value }))}
                              className={`px-3.5 py-1.5 text-xs rounded-full border transition-all ${
                                isSelected
                                  ? 'bg-[#7B1C2E] text-white font-bold border-[#7B1C2E] shadow-sm'
                                  : 'bg-stone-100 text-stone-800 border-stone-300 font-medium hover:bg-stone-200'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div>
              <label htmlFor="dish-order-note" className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wider">
                Note for this dish
              </label>
              <textarea
                id="dish-order-note"
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
                rows={2}
                maxLength={240}
                placeholder="e.g. Less spicy, sauce on the side"
                className="w-full resize-none border border-stone-300 rounded-xl p-3 text-sm text-stone-900 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Quantity + Add to Cart Footer Actions */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center rounded-xl overflow-hidden border border-stone-300 bg-stone-100">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-stone-200 text-stone-800 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Icon name="MinusIcon" size={14} />
                </button>
                <span className="w-10 text-center text-sm font-bold text-stone-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(item.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-stone-200 text-stone-800 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Icon name="PlusIcon" size={14} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 ${
                  isOutOfStock ? 'opacity-40 cursor-not-allowed bg-stone-400' : ''
                }`}
                style={{
                  background: isOutOfStock
                    ? undefined
                    : addedPulse
                    ? 'linear-gradient(135deg, #2D7A4F 0%, #3DA866 100%)'
                    : 'linear-gradient(135deg, #7B1C2E 0%, #9B2C3E 100%)',
                }}
                aria-label={`Add ${item.name} to cart`}
              >
                <Icon name={addedPulse ? 'CheckIcon' : 'ShoppingCartIcon'} size={16} />
                {isOutOfStock ? 'Unavailable' : addedPulse ? 'Added to Cart!' : `Add ${quantity > 1 ? `${quantity}×` : ''} to Cart — ₱${(item.price * quantity).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuItemDetailModal({ item, onClose, ratingSummary }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !item) return null;

  return createPortal(
    <ModalContent item={item} onClose={onClose} ratingSummary={ratingSummary} />,
    document.body
  );
}