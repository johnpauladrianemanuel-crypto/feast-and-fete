'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import { useCart } from '@/lib/cartContext';
import Icon from '@/components/ui/AppIcon';

export default function CartDrawer() {
  const { state, removeItem, updateQuantity, closeCart, totalAmount } = useCart();
  const router = useRouter();

  if (!state?.isOpen) return null;

  const hasItems = state?.items?.length > 0;

  function handleProceedToCheckout() {
    if (!hasItems) return;
    closeCart();
    router?.push('/cart-review');
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-card z-50 flex flex-col min-h-0 animate-fade-in"
        style={{ boxShadow: '-8px 0 32px rgba(44,24,16,0.18)' }}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon name="ShoppingCartIcon" size={20} className="text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Your Cart</h2>
            {state?.items?.length > 0 && (
              <span className="gradient-brand text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {state?.items?.reduce((s, i) => s + i?.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Close cart"
          >
            <Icon name="XMarkIcon" size={18} className="text-foreground" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-3 px-4 space-y-3 pb-36">
          {state?.items?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Icon name="ShoppingCartIcon" size={28} className="text-muted-foreground" />
              </div>
              <p className="font-display text-base font-semibold text-foreground mb-1">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mb-4">Browse our menu and add food trays to get started.</p>
              <button
                onClick={closeCart}
                className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors duration-150"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            state?.items?.map(item => (
              <div
                key={item?.id}
                className="flex gap-3 p-3 bg-background rounded-xl border border-border"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <AppImage
                    src={item?.menuItem?.image}
                    alt={item?.menuItem?.imageAlt}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-semibold text-foreground truncate">{item?.menuItem?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item?.menuItem?.servingSize}</p>
                  {item?.customizations && Object.keys(item?.customizations)?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(item?.customizations)?.map(([key, value]) => {
                        const customizationDef = item?.menuItem?.customizations?.find(c => c?.id === key);
                        const optionLabel = customizationDef?.options?.find(o => o?.value === value)?.label ?? value;
                        return (
                          <span
                            key={key}
                            className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(123,28,46,0.1)', color: '#7B1C2E', border: '1px solid rgba(123,28,46,0.2)' }}
                          >
                            {optionLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-sm font-bold text-primary mt-1">₱{(item?.menuItem?.price * item?.quantity)?.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
                  <button
                    onClick={() => removeItem(item?.menuItem?.id)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-error/10 transition-colors"
                    aria-label={`Remove ${item?.menuItem?.name}`}
                  >
                    <Icon name="TrashIcon" size={14} className="text-error" />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item?.menuItem?.id, item?.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-md border border-border hover:border-primary hover:text-primary transition-colors text-foreground"
                      aria-label="Decrease quantity"
                    >
                      <Icon name="MinusIcon" size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-foreground tabular-nums">{item?.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item?.menuItem?.id, item?.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-md border border-border hover:border-primary hover:text-primary transition-colors text-foreground"
                      aria-label="Increase quantity"
                    >
                      <Icon name="PlusIcon" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {hasItems && (
          <div className="border-t border-border px-5 py-4 space-y-3 sticky bottom-0 bg-card" style={{ zIndex: 2 }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
              <span className="text-base font-bold text-foreground tabular-nums">₱{totalAmount?.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">Delivery fee calculated at checkout.</p>
            {/* Item count validation summary */}
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
              <Icon name="CheckCircleIcon" size={14} className="text-primary flex-shrink-0" />
              <span className="text-xs text-primary font-medium">
                {state?.items?.reduce((s, i) => s + i?.quantity, 0)} item{state?.items?.reduce((s, i) => s + i?.quantity, 0) !== 1 ? 's' : ''} ready for checkout
              </span>
            </div>
            <button
              onClick={handleProceedToCheckout}
              className="block w-full text-center py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all"
            >
              Proceed to Checkout →
            </button>
            <button
              onClick={closeCart}
              className="block w-full text-center py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue Browsing
            </button>
          </div>
        )}
      </div>
    </>
  );
}