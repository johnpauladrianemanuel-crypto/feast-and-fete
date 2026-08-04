'use client';
import React, { useState, useEffect, useRef } from 'react';
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  beef: { bg: 'rgba(139,0,0,0.12)', text: '#8B0000', glow: 'rgba(139,0,0,0.25)' },
  pork: { bg: 'rgba(210,105,30,0.12)', text: '#8B4513', glow: 'rgba(210,105,30,0.25)' },
  chicken: { bg: 'rgba(212,160,23,0.14)', text: '#8B6914', glow: 'rgba(212,160,23,0.3)' },
  seafood: { bg: 'rgba(0,105,148,0.12)', text: '#006994', glow: 'rgba(0,105,148,0.25)' },
  pasta: { bg: 'rgba(180,60,0,0.12)', text: '#8B3A00', glow: 'rgba(180,60,0,0.25)' },
  vegetables: { bg: 'rgba(34,100,34,0.12)', text: '#1F6B1F', glow: 'rgba(34,100,34,0.25)' },
  desserts: { bg: 'rgba(180,80,140,0.12)', text: '#8B3A6B', glow: 'rgba(180,80,140,0.25)' },
  packages: { bg: 'rgba(123,28,46,0.12)', text: '#7B1C2E', glow: 'rgba(123,28,46,0.25)' },
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

function Dish3D({ image, alt, catColor }: { image: string; alt: string; catColor: { glow: string } }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [floatPhase, setFloatPhase] = useState(0);
  const [plateRotation, setPlateRotation] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      setFloatPhase(elapsed);
      setPlateRotation((elapsed * 0.02) % 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setRotation({ x: -dy * 18, y: dx * 18 });
  }

  const floatY = Math.sin(floatPhase * 0.001) * 10;
  const floatScale = 1 + Math.sin(floatPhase * 0.0015) * 0.025;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ perspective: '900px', height: '280px' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setRotation({ x: 0, y: 0 }); }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '220px', height: '60px', bottom: '20px', left: '50%',
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse, ${catColor.glow} 0%, transparent 70%)`,
          filter: 'blur(12px)',
          opacity: isHovered ? 0.9 : 0.6,
          transition: 'opacity 400ms ease',
        }}
      />
      <div
        className="absolute rounded-full border-2 pointer-events-none"
        style={{
          width: '240px', height: '240px',
          borderColor: `${catColor.glow}`,
          borderStyle: 'dashed',
          transform: `rotateX(75deg) rotateZ(${plateRotation}deg)`,
          opacity: 0.3, bottom: '10px', left: '50%', marginLeft: '-120px',
        }}
      />
      <div
        style={{
          transform: isHovered
            ? `translateY(${floatY}px) scale(${floatScale}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
            : `translateY(${floatY}px) scale(${floatScale}) rotateX(4deg)`,
          transition: isHovered ? 'transform 80ms linear' : 'transform 600ms cubic-bezier(0.34,1.56,0.64,1)',
          transformStyle: 'preserve-3d',
          filter: `drop-shadow(0 24px 32px ${catColor.glow}) drop-shadow(0 8px 16px rgba(0,0,0,0.3))`,
          willChange: 'transform',
        }}
      >
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: '220px', height: '220px',
            boxShadow: `0 0 40px ${catColor.glow}, 0 16px 48px rgba(0,0,0,0.35)`,
          }}
        >
          <AppImage src={image} alt={alt} width={220} height={220} className="w-full h-full object-cover" />
        </div>
      </div>
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '6px', height: '6px', background: '#D4A017',
            left: `${20 + i * 20}%`, top: `${15 + (i % 2) * 30}%`,
            opacity: Math.abs(Math.sin((floatPhase * 0.002) + i * 1.5)) * 0.8,
            transform: `scale(${0.5 + Math.abs(Math.sin((floatPhase * 0.003) + i)) * 0.8})`,
            boxShadow: '0 0 6px #D4A017',
          }}
        />
      ))}
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
    // Use double rAF to ensure browser has painted before starting transition
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

  const catColor = CATEGORY_COLORS[item.categorySlug] ?? { bg: 'rgba(100,100,100,0.1)', text: '#555', glow: 'rgba(100,100,100,0.2)' };
  const isOutOfStock = item.stock === 0;
  const isLowStock = item.stock > 0 && item.stock <= 5;

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: visible ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
        transition: 'background 350ms ease, backdrop-filter 350ms ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '672px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '24px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.92)',
          transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1), transform 420ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px', zIndex: 10,
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--muted)', color: 'var(--muted-foreground)',
            border: 'none', cursor: 'pointer', transition: 'transform 200ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label="Close"
        >
          <Icon name="XMarkIcon" size={18} />
        </button>

        {/* 3D Dish section */}
        <div
          style={{
            position: 'relative',
            paddingTop: '32px', paddingBottom: '16px', paddingLeft: '32px', paddingRight: '32px',
            borderRadius: '24px 24px 0 0',
            overflow: 'hidden',
            background: `radial-gradient(ellipse at 50% 0%, ${catColor.bg} 0%, transparent 70%)`,
          }}
        >
          <div
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `radial-gradient(circle at 50% 50%, ${catColor.glow} 0%, transparent 60%)`,
              opacity: 0.15,
            }}
          />
          <Dish3D image={item.image} alt={item.imageAlt} catColor={catColor} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '9999px', background: catColor.bg, color: catColor.text, border: `1px solid ${catColor.text}30` }}>
              {item.category}
            </span>
            {item.featured && (
              <span style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '9999px', background: 'rgba(212,160,23,0.92)', color: '#2C1810', boxShadow: '0 2px 8px rgba(212,160,23,0.4)' }}>
                ⭐ Best Seller
              </span>
            )}
            {isLowStock && (
              <span style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '9999px', background: 'rgba(234,179,8,0.15)', color: 'var(--warning)', border: '1px solid rgba(234,179,8,0.3)' }}>
                🔥 Only {item.stock} left!
              </span>
            )}
            {isOutOfStock && (
              <span style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '9999px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }}>
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 32px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Title + price */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-display, inherit)', fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.3, flex: 1, margin: 0 }}>
              {item.name}
            </h2>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-display, inherit)', fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>
                ₱{item.price.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>per tray</div>
            </div>
          </div>

          {ratingSummary && ratingSummary.reviewCount > 0 && (
            <StarDisplay rating={ratingSummary.averageRating} count={ratingSummary.reviewCount} />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--muted-foreground)' }}>
            <Icon name="UsersIcon" size={16} />
            <span>{item.servingSize}</span>
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

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Customizations */}
          {item.customizations && item.customizations.length > 0 && (
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
              <div style={{ borderTop: '1px solid var(--border)' }} />
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                onClick={() => setQuantity(q => q + 1)}
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
              {addedPulse ? 'Added to Cart!' : `Add ${quantity > 1 ? `${quantity}×` : ''} to Cart — ₱${(item.price * quantity).toLocaleString()}`}
            </button>
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
