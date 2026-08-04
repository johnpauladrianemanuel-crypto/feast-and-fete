'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import Icon from '@/components/ui/AppIcon';
import { CartItem } from '@/lib/cartContext';

interface OrderData {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  deliveryMethod: 'delivery' | 'pickup';
  address: string;
  eventDate: string;
  eventTime: string;
  paymentMethod: string;
  notes: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  isGuest?: boolean;
  guestProfileId?: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: 'Cash on Delivery',
  card: 'Credit / Debit Card',
  bank_transfer: 'Bank Transfer',
  gcash: 'GCash',
  cash: 'Cash on Pickup',
};

const TIMELINE_STEPS = [
  { label: 'Order Received', desc: "We\'ve received your order and are reviewing it.", icon: 'ClipboardDocumentCheckIcon', time: 'Now' },
  { label: 'Order Confirmed', desc: 'Our team confirms availability and prepares your tray.', icon: 'CheckBadgeIcon', time: '~2 hours' },
  { label: 'Preparation', desc: 'Our chefs begin cooking your Filipino food trays.', icon: 'FireIcon', time: '1–2 days before event' },
  { label: 'Ready for Delivery / Pickup', desc: 'Your order is packed and ready to go.', icon: 'TruckIcon', time: 'Event day' },
];

export default function OrderConfirmationContent() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('feastfete_order');
    if (raw) {
      try {
        const parsed: OrderData = JSON.parse(raw);
        setOrder(parsed);
        // Build guest tracking URL with order number as query param
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        setTrackingUrl(`${base}/order-status?order=${encodeURIComponent(parsed.orderId)}`);
      } catch {
        setOrder(null);
      }
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNavbar />
        <CartDrawer />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Icon name="ExclamationCircleIcon" size={36} className="text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">No order found</h2>
          <p className="text-muted-foreground mb-6">It looks like you haven&apos;t placed an order yet.</p>
          <Link href="/menu-browse-screen" className="px-6 py-3 gradient-brand text-primary-foreground font-semibold rounded-xl btn-3d">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = order.eventDate
    ? new Date(order.eventDate + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />

      <div className="max-w-3xl mx-auto px-4 py-12 lg:px-8">
        {/* Success Banner */}
        <div
          className="bg-card rounded-2xl border border-border p-8 text-center mb-8"
          style={{ boxShadow: 'var(--shadow-3d)' }}
        >
          <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckIcon" size={32} className="text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Order Placed!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you, <strong className="text-foreground">{order.customerName}</strong>! Your order has been received.
          </p>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-5 py-2.5">
            <Icon name="HashtagIcon" size={16} className="text-primary" />
            <span className="font-mono text-base font-bold text-primary tracking-wider">{order.orderId}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Save this order number for tracking</p>
        </div>

        {/* Guest Order Tracking Link */}
        {order.isGuest && trackingUrl && (
          <div
            className="bg-card rounded-2xl border border-primary/30 p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ boxShadow: 'var(--shadow-3d)' }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                <Icon name="MagnifyingGlassIcon" size={20} className="text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Guest Order Tracking</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use this link to track your order status at any time.
                </p>
                <p className="text-xs text-primary font-mono truncate mt-1">{trackingUrl}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined') {
                    navigator.clipboard?.writeText(trackingUrl);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <Icon name="ClipboardDocumentIcon" size={14} />
                Copy Link
              </button>
              <Link
                href={`/order-status?order=${encodeURIComponent(order.orderId)}`}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary-foreground gradient-brand rounded-lg btn-3d transition-all"
              >
                <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                Track Now
              </Link>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-border p-5" style={{ boxShadow: 'var(--shadow-3d)' }}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Delivery Details</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Icon name={order.deliveryMethod === 'delivery' ? 'TruckIcon' : 'BuildingStorefrontIcon'} size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground capitalize">{order.deliveryMethod}</p>
                  <p className="text-xs text-muted-foreground">{order.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="CalendarDaysIcon" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{formattedDate}</p>
                  <p className="text-xs text-muted-foreground">{order.eventTime}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5" style={{ boxShadow: 'var(--shadow-3d)' }}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact & Payment</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon name="EnvelopeIcon" size={16} className="text-primary flex-shrink-0" />
                <p className="text-sm text-foreground truncate">{order.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="PhoneIcon" size={16} className="text-primary flex-shrink-0" />
                <p className="text-sm text-foreground">{order.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="CreditCardIcon" size={16} className="text-primary flex-shrink-0" />
                <p className="text-sm text-foreground">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Ordered */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8" style={{ boxShadow: 'var(--shadow-3d)' }}>
          <h3 className="font-display text-base font-bold text-foreground mb-4">Items Ordered</h3>
          <div className="space-y-2 mb-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b border-border last:border-0">
                <div>
                  <span className="font-medium text-foreground">{item.menuItem.name}</span>
                  <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                </div>
                <span className="font-semibold text-foreground tabular-nums">₱{(item.menuItem.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground tabular-nums">₱{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery fee</span>
              <span className="text-foreground tabular-nums">{order.deliveryFee === 0 ? 'Free' : `₱${order.deliveryFee}`}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span className="text-foreground">Total Paid</span>
              <span className="text-primary tabular-nums">₱{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Estimated Timeline */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8" style={{ boxShadow: 'var(--shadow-3d)' }}>
          <h3 className="font-display text-base font-bold text-foreground mb-6 flex items-center gap-2">
            <Icon name="ClockIcon" size={18} className="text-primary" />
            Estimated Timeline
          </h3>
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
            <div className="space-y-6">
              {TIMELINE_STEPS.map((step, idx) => (
                <div key={step.label} className="flex gap-4 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                    idx === 0 ? 'gradient-brand' : 'bg-muted border-2 border-border'
                  }`}>
                    <Icon
                      name={step.icon as Parameters<typeof Icon>[0]['name']}
                      size={18}
                      className={idx === 0 ? 'text-primary-foreground' : 'text-muted-foreground'}
                    />
                  </div>
                  <div className="flex-1 pt-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${idx === 0 ? 'text-primary' : 'text-foreground'}`}>{step.label}</p>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{step.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
            <h3 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
              <Icon name="ChatBubbleLeftEllipsisIcon" size={16} className="text-amber-600" />
              Your Special Instructions
            </h3>
            <p className="text-sm text-amber-700">{order.notes}</p>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/order-status${order.orderId ? `?order=${encodeURIComponent(order.orderId)}` : ''}`}
            className="flex-1 text-center py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all"
          >
            Track My Order
          </Link>
          <Link
            href="/menu-browse-screen"
            className="flex-1 text-center py-3 border border-border text-foreground font-semibold text-sm rounded-xl hover:bg-muted transition-colors"
          >
            Order More Items
          </Link>
          <Link
            href="/"
            className="flex-1 text-center py-3 border border-border text-foreground font-semibold text-sm rounded-xl hover:bg-muted transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
