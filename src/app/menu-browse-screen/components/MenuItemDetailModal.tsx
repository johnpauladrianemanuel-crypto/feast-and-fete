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
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    item.customizations?.forEach(c => { defaults[c.id] = c.defaultValue; });
    return defaults;
  });

  useEffect(() => {
    setQuantity(1);
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
  const isOutOfStock = item.stock <= 2;
  const isLowStock = item.stock > 2 && item.stock <= 5;

  function handleAdd() {
    const customizationsToSave = Object.keys(selectedCustomizations).length > 0 ? selectedCustomizations : undefined;
    for (let i = 0; i < quantity; i++) addItem(item, customizationsToSave);
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 800);
    toast.success(`${quantity}× ${item.name} added!`, {
      description: `₱${(item.price * quantity).toLocaleString()} total`,
      action: { label: 'View Cart', onClick: openCart },
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        background: visible ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(10px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(10px)' : 'blur(0px)',
        transition: 'background 350ms ease, backdrop-filter 350ms ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.92)',
          transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1), transform 420ms cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Scrollable Container */}
        <div style={{ overflowY: 'auto', width: '100%', background: '#ffffff' }}>
          
          {/* Header Image Area with Smooth Seamless Fade */}
          <div className="relative w-full h-[290px] bg-white flex-shrink-0">
            <AppImage
              src={item.image}
              alt={item.imageAlt || item.name}
              width={580}
              height={290}
              className="w-full h-full object-cover"
            />

            <div 
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.85) 80%, rgba(255,255,255,1) 100%)',
              }}
            />

            {/* Badges on Top Left */}
            <div className="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
              <span
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.92)',
                  color: catColor.text,
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                {item.category}
              </span>

              {item.featured && (
                <span
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    background: 'rgba(212,160,23,0.92)',
                    color: '#2C1810',
                    boxShadow: '0 2px 8px rgba(212,160,23,0.4)',
                  }}
                >
                  ⭐ Best Seller
                </span>
              )}

              {isLowStock && (
                <span
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    background: 'rgba(234,179,8,0.9)',
                    color: '#000000',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                >
                  🔥 Only {item.stock} left!
                </span>
              )}

              {isOutOfStock && (
                <span
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    background: 'rgba(239,68,68,0.9)',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                >
                  Unavailable
                </span>
              )}
            </div>

            {/* Close Button on Top Right */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 30,
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', color: '#ffffff',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'transform 200ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Close"
            >
              <Icon name="XMarkIcon" size={18} />
            </button>

            {/* Dish Title & Price */}
            <div 
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '24px',
                right: '24px',
                zIndex: 20,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-display, inherit)', fontSize: '26px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, margin: 0 }}>
                {item.name}
              </h2>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-display, inherit)', fontSize: '26px', fontWeight: 800, color: 'var(--primary)' }}>
                  ₱{item.price.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#4A4A4A' }}>per tray</div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', paddingTop: '16px', background: '#ffffff', marginTop: '-2px' }}>
            {ratingSummary && ratingSummary.reviewCount > 0 && (
              <StarDisplay rating={ratingSummary.averageRating} count={ratingSummary.reviewCount} />
            )}

<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', color: 'var(--muted-foreground)' }}>              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="UsersIcon" size={16} />
                <span>{item.servingSize}</span>
              </div>
              <div style={{ fontWeight: 600, color: '#d97706' }}>
                Available Stock: {item.stock}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
                About this dish
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: 0 }}>
                {item.description}
              </p>
            </div>

            {/* Customizations */}
            {item.customizations && item.customizations.length > 0 && (
              <>
                <div style={{ borderTop: '1px solid var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
                    I-Customize ang Order Mo
                  </h3>
                  {item.customizations.map(customization => (
                    <div key={customization.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                        {customization.label}
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {customization.options.map(option => {
                          const isSelected = selectedCustomizations[customization.id] === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => setSelectedCustomizations(prev => ({ ...prev, [customization.id]: option.value }))}
                              style={{
                                padding: '7px 14px',
                                fontSize: '13px',
                                fontWeight: isSelected ? 700 : 500,
                                borderRadius: '20px',
                                border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                                background: isSelected ? 'var(--primary)' : 'var(--muted)',
                                color: isSelected ? 'var(--primary-foreground)' : 'var(--foreground)',
                                cursor: 'pointer',
                                transition: 'all 180ms ease',
                                boxShadow: isSelected ? '0 2px 10px rgba(123,28,46,0.25)' : 'none',
                              }}
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

            {/* Quantity + Add to Cart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--muted)' }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}
                  aria-label="Decrease quantity"
                >
                  <Icon name="MinusIcon" size={14} />
                </button>
                <span style={{ width: '40px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(item.stock, q + 1))}
                  style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}
                  aria-label="Increase quantity"
                >
                  <Icon name="PlusIcon" size={14} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px 16px', fontSize: '14px', fontWeight: 700, borderRadius: '12px',
                  border: 'none', cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.4 : 1,
                  background: addedPulse
                    ? 'linear-gradient(135deg, #2D7A4F 0%, #3DA866 100%)'
                    : 'linear-gradient(135deg, #7B1C2E 0%, #9B2C3E 100%)',
                  color: 'white',
                  boxShadow: addedPulse ? '0 6px 20px rgba(45,122,79,0.5)' : '0 6px 20px rgba(123,28,46,0.35)',
                  transform: addedPulse ? 'scale(0.96)' : 'scale(1)',
                  transition: 'background 250ms ease, box-shadow 250ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
                }}
                aria-label={`Add ${item.name} to cart`}
              >
                <Icon name={addedPulse ? 'CheckIcon' : 'ShoppingCartIcon'} size={16} />
                {isOutOfStock ? 'Unavailable (Low Stock)' : addedPulse ? 'Added to Cart!' : `Add ${quantity > 1 ? `${quantity}×` : ''} to Cart — ₱${(item.price * quantity).toLocaleString()}`}
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