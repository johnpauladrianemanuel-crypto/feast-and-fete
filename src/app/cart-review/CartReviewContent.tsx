'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cartContext';

export default function CartReviewContent() {
  const { state, removeItem, updateQuantity, totalAmount } = useCart();
  const router = useRouter();

  const deliveryFee = 150;
  const subtotal = totalAmount;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />
      <div className="max-w-5xl mx-auto px-4 py-10 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/menu-browse-screen" className="hover:text-primary transition-colors">Menu</Link>
          <Icon name="ChevronRightIcon" size={14} />
          <span className="text-foreground font-medium">Cart Review</span>
          <Icon name="ChevronRightIcon" size={14} />
          <span className="text-muted-foreground">Checkout</span>
          <Icon name="ChevronRightIcon" size={14} />
          <span className="text-muted-foreground">Confirmation</span>
        </nav>

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Review Your Order</h1>
        <p className="text-muted-foreground mb-8">Check your items before proceeding to checkout.</p>

        {state?.items?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <Icon name="ShoppingCartIcon" size={36} className="text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some delicious Filipino food trays to get started.</p>
            <Link
              href="/menu-browse-screen"
              className="px-6 py-3 gradient-brand text-primary-foreground font-semibold rounded-xl btn-3d transition-all"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {state?.items?.map((item) => (
                <div
                  key={item?.id}
                  className="flex gap-4 p-4 bg-card rounded-2xl border border-border"
                  style={{ boxShadow: 'var(--shadow-3d)' }}
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <AppImage
                      src={item?.menuItem?.image}
                      alt={item?.menuItem?.imageAlt}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground">{item?.menuItem?.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{item?.menuItem?.servingSize}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item?.menuItem?.category}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item?.menuItem?.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                        aria-label={`Remove ${item?.menuItem?.name}`}
                      >
                        <Icon name="TrashIcon" size={15} className="text-error" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item?.menuItem?.id, item?.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-card transition-colors text-foreground"
                          aria-label="Decrease quantity"
                        >
                          <Icon name="MinusIcon" size={13} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-foreground tabular-nums">{item?.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item?.menuItem?.id, item?.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-card transition-colors text-foreground"
                          aria-label="Increase quantity"
                        >
                          <Icon name="PlusIcon" size={13} />
                        </button>
                      </div>
                      <p className="font-bold text-primary text-base tabular-nums">
                        ₱{(item?.menuItem?.price * item?.quantity)?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <Link
                href="/menu-browse-screen"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mt-2"
              >
                <Icon name="PlusCircleIcon" size={16} />
                Add more items
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div
                className="bg-card rounded-2xl border border-border p-6 sticky top-24"
                style={{ boxShadow: 'var(--shadow-3d)' }}
              >
                <h2 className="font-display text-lg font-bold text-foreground mb-5">Order Summary</h2>
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({state?.items?.reduce((s, i) => s + i?.quantity, 0)} items)</span>
                    <span className="font-medium text-foreground tabular-nums">₱{subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated delivery fee</span>
                    <span className="font-medium text-foreground tabular-nums">₱{deliveryFee?.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-lg tabular-nums">₱{total?.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-5">Final delivery fee confirmed at checkout based on your address.</p>
                <button
                  onClick={() => router?.push('/customer-review-payment')}
                  className="w-full py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all"
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
