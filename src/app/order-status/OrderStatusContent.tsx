'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import Icon from '@/components/ui/AppIcon';
import ReviewModal from '@/app/components/ReviewModal';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Shipped' | 'Completed' | 'Cancelled' | string;

interface OrderItem {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ReviewableItem {
  menuItemId: string;
  menuItemName: string;
  orderId?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_address: string | null;
  event_date: string | null;
  event_time: string | null;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const TIMELINE_STEPS: {
  status: string;
  label: string;
  desc: string;
  icon: string;
  activeIcon: string;
  estimatedTime: string;
  etaLabel: string;
  color: string;
}[] = [
  {
    status: 'pending',
    label: 'Order Received',
    desc: "We've received your order and are reviewing it.",
    icon: 'ClipboardDocumentCheckIcon',
    activeIcon: 'ClipboardDocumentCheckIcon',
    estimatedTime: 'Just now',
    etaLabel: 'Received',
    color: '#f59e0b',
  },
  {
    status: 'confirmed',
    label: 'Order Confirmed',
    desc: 'Our team has confirmed availability and is preparing your tray.',
    icon: 'CheckBadgeIcon',
    activeIcon: 'CheckBadgeIcon',
    estimatedTime: 'Within 2 hours',
    etaLabel: 'Confirmed',
    color: '#3b82f6',
  },
  {
    status: 'preparing',
    label: 'Preparing',
    desc: 'Our chefs are cooking your Filipino food trays with care.',
    icon: 'FireIcon',
    activeIcon: 'FireIcon',
    estimatedTime: '1–2 days before event',
    etaLabel: 'In Kitchen',
    color: '#f97316',
  },
  {
    status: 'ready',
    label: 'Ready for Pickup / Delivery',
    desc: 'Your order is freshly packed and ready!',
    icon: 'SparklesIcon',
    activeIcon: 'SparklesIcon',
    estimatedTime: 'Event day',
    etaLabel: 'Ready',
    color: '#22c55e',
  },
  {
    status: 'shipped',
    label: 'On the Way',
    desc: 'Your order is packed and heading to you!',
    icon: 'TruckIcon',
    activeIcon: 'TruckIcon',
    estimatedTime: 'Event day',
    etaLabel: 'Shipped',
    color: '#8b5cf6',
  },
];

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'completed'];

const PAYMENT_LABELS: Record<string, string> = {
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash on Pickup',
  cash_on_delivery: 'Cash on Delivery',
};

const STATUS_BADGE: Record<string, { bg: string; text: string; dot?: boolean }> = {
  pending: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-700', dot: true },
  confirmed: { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-700', dot: true },
  preparing: { bg: 'bg-orange-100 border-orange-200', text: 'text-orange-700', dot: true },
  ready: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700', dot: true },
  shipped: { bg: 'bg-purple-100 border-purple-200', text: 'text-purple-700', dot: true },
  completed: { bg: 'bg-green-100 border-green-200', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100 border-red-200', text: 'text-red-700' },
};

function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'pending';
  return status.trim().toLowerCase();
}

function getStepState(stepStatus: string, currentStatus: string): 'completed' | 'active' | 'upcoming' {
  const normCurrent = normalizeStatus(currentStatus);
  const normStep = normalizeStatus(stepStatus);

  if (normCurrent === 'cancelled') return 'upcoming';
  if (normCurrent === 'completed') return 'completed';

  const stepIdx = STATUS_ORDER.indexOf(normStep);
  const currentIdx = STATUS_ORDER.indexOf(normCurrent);

  if (currentIdx === -1) return stepIdx === 0 ? 'active' : 'upcoming';
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return 'upcoming';
}

function AnimatedProgressBar({ percent, status }: { percent: number; status: string }) {
  const [displayPercent, setDisplayPercent] = useState(0);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = setTimeout(() => {
      setDisplayPercent(percent);
    }, 300);
    return () => {
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [percent]);

  const totalSteps = TIMELINE_STEPS.length;
  const stepPercents = TIMELINE_STEPS.map((_, i) => Math.round((i / (totalSteps - 1)) * 100));

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-3 px-1">
        {TIMELINE_STEPS.map((step) => {
          const state = getStepState(step.status, status);
          return (
            <div key={step.status} className="flex flex-col items-center gap-1" style={{ width: `${100 / totalSteps}%` }}>
              <div
                className={`relative flex items-center justify-center rounded-full transition-all duration-500 ${
                  state === 'active'
                    ? 'w-10 h-10 shadow-lg'
                    : state === 'completed'
                    ? 'w-8 h-8'
                    : 'w-7 h-7'
                }`}
                style={{
                  background: state === 'upcoming' ? 'var(--muted)' : step.color,
                  boxShadow:
                    state === 'active'
                      ? `0 0 0 4px ${step.color}33, 0 0 16px ${step.color}55`
                      : undefined,
                }}
              >
                {state === 'active' && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: `${step.color}44` }}
                  />
                )}
                <Icon
                  name={step.icon as Parameters<typeof Icon>[0]['name']}
                  size={state === 'active' ? 18 : state === 'completed' ? 14 : 12}
                  className={state === 'upcoming' ? 'text-muted-foreground' : 'text-white'}
                />
                {state === 'active' && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card animate-bounce"
                    style={{ background: step.color }}
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium text-center leading-tight transition-all duration-300 ${
                  state === 'active'
                    ? 'text-foreground font-bold'
                    : state === 'completed'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
                style={{ fontSize: '10px' }}
              >
                {step.etaLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ width: `${displayPercent}%`, transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <div
            className="h-full w-full rounded-full relative"
            style={{
              background: `linear-gradient(90deg, #D4A017, #f59e0b, #D4A017)`,
              backgroundSize: '200% 100%',
              animation: displayPercent > 0 ? 'shimmer 2s linear infinite' : 'none',
            }}
          />
        </div>
        {displayPercent > 0 && displayPercent < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg transition-all duration-1000"
            style={{
              left: `calc(${displayPercent}% - 8px)`,
              background: '#D4A017',
              boxShadow: '0 0 8px 3px rgba(212,160,23,0.6)',
              transition: 'left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        )}
        {stepPercents.slice(1, -1).map((sp, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-0.5 bg-background/40"
            style={{ left: `${sp}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-muted-foreground">Order Placed</span>
        <span className="text-xs font-semibold" style={{ color: '#D4A017' }}>
          {displayPercent}% Complete
        </span>
        <span className="text-xs text-muted-foreground">Completed</span>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function StageCard({ order }: { order: Order }) {
  const normStatus = normalizeStatus(order.status);
  const currentIdx = STATUS_ORDER.indexOf(normStatus);
  const currentStep = TIMELINE_STEPS[currentIdx >= 0 && currentIdx < TIMELINE_STEPS.length ? currentIdx : 0];
  const nextStep = TIMELINE_STEPS[currentIdx + 1];

  if (normStatus === 'cancelled' || normStatus === 'completed') return null;

  return (
    <div
      className="rounded-2xl border p-5 mb-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${currentStep.color}15, ${currentStep.color}05)`,
        borderColor: `${currentStep.color}40`,
        boxShadow: `0 0 24px ${currentStep.color}20`,
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-20 animate-pulse"
        style={{ background: `radial-gradient(circle at 80% 50%, ${currentStep.color}30, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
          style={{ background: `${currentStep.color}20`, border: `2px solid ${currentStep.color}50` }}
        >
          <span
            className="absolute inset-0 rounded-2xl animate-ping opacity-30"
            style={{ background: currentStep.color }}
          />
          <Icon
            name={currentStep.activeIcon as Parameters<typeof Icon>[0]['name']}
            size={26}
            style={{ color: currentStep.color }}
            className={normStatus === 'preparing' ? 'animate-bounce' : normStatus === 'shipped' || normStatus === 'ready' ? 'animate-pulse' : ''}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: currentStep.color }}>
              Current Stage
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: `${currentStep.color}20`, color: currentStep.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: currentStep.color }} />
              Live
            </span>
          </div>
          <p className="text-base font-bold text-foreground">{currentStep.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{currentStep.desc}</p>
        </div>

        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-xs text-muted-foreground mb-0.5">Est. Time</p>
          <p className="text-sm font-bold text-foreground">{currentStep.estimatedTime}</p>
          {nextStep && (
            <p className="text-xs mt-1" style={{ color: currentStep.color }}>
              Next: {nextStep.label} →
            </p>
          )}
        </div>
      </div>

      {nextStep && (
        <div className="sm:hidden mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: `${currentStep.color}30` }}>
          <span className="text-xs text-muted-foreground">Est. {currentStep.estimatedTime}</span>
          <span className="text-xs font-medium" style={{ color: currentStep.color }}>Next: {nextStep.label} →</span>
        </div>
      )}
    </div>
  );
}

export default function OrderStatusContent() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [reviewItems, setReviewItems] = useState<ReviewableItem[]>([]);
  const [reviewerName, setReviewerName] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('feastfete_reviewed_orders');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        setReviewedOrders(new Set(parsed));
      } catch {
        setReviewedOrders(new Set());
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('feastfete_reviewed_orders', JSON.stringify(Array.from(reviewedOrders)));
  }, [reviewedOrders]);

  const activeOrder = selectedOrder;

  const fetchMyOrders = useCallback(async () => {
    if (!user) return;
    setMyOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMyOrders(data as Order[]);
        
        const urlParams = new URLSearchParams(window.location.search);
        const queryOrderNum = urlParams.get('order');

        if (queryOrderNum) {
          const match = (data as Order[]).find(
            (o) => o.order_number.toUpperCase() === queryOrderNum.trim().toUpperCase()
          );
          if (match) {
            setSelectedOrder(match);
            setMyOrdersLoading(false);
            return;
          }
        }

        const active = (data as Order[]).find(
          (o) => !['completed', 'cancelled'].includes(normalizeStatus(o.status))
        );
        
        if (active) {
          setSelectedOrder(active);
        } else if (data.length > 0) {
          const isFirstReviewed = reviewedOrders.has(data[0].id);
          setSelectedOrder(data[0] as Order);
          if (isFirstReviewed) {
            setShowHistory(true);
          }
        }
      }
    } finally {
      setMyOrdersLoading(false);
    }
  }, [user, supabase, reviewedOrders]);

  useEffect(() => {
    if (user) fetchMyOrders();
  }, [user, fetchMyOrders]);

  useEffect(() => {
    if (!activeOrder?.id || !user) return;

    const channel = supabase
      .channel(`order_status_${activeOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${activeOrder.id}`,
        },
        (payload) => {
          const updated = payload.new as Partial<Order>;

          setSelectedOrder((prev) => (prev ? { ...prev, ...updated } : prev));
          setMyOrders((prev) =>
            prev.map((o) => (o.id === activeOrder.id ? { ...o, ...updated } : o))
          );
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder?.id, user, supabase]);

  function openReviewModal(order: Order) {
    const items: ReviewableItem[] = (order.order_items || []).map((item) => ({
      menuItemId: item.menu_item_id,
      menuItemName: item.menu_item_name,
      orderId: order.id,
    }));

    setReviewItems(items);
    setReviewerName(order.customer_name || order.customer_email || 'Customer');
    setShowReview(true);
  }

  function handleReviewComplete(orderId: string) {
    setReviewedOrders((prev) => new Set(prev).add(orderId));
    setShowReview(false);
    setShowHistory(true);
  }

  const normStatus = normalizeStatus(activeOrder?.status);
  const currentStepIndex = activeOrder ? STATUS_ORDER.indexOf(normStatus) : -1;
  
  const progressPercent =
    activeOrder && normStatus !== 'cancelled'
      ? normStatus === 'completed'
        ? 100
        : Math.max(
            0,
            Math.min(
              100,
              Math.round((Math.max(0, currentStepIndex) / (STATUS_ORDER.length - 1)) * 100)
            )
          )
      : 0;

  const formattedEventDate = activeOrder?.event_date
    ? new Date(activeOrder.event_date + 'T00:00:00').toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const isCurrentOrderReviewed = activeOrder ? reviewedOrders.has(activeOrder.id) : false;

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />

      {showReview && reviewItems.length > 0 && (
        <ReviewModal
          items={reviewItems}
          reviewerName={reviewerName}
          userId={user?.id}
          onClose={() => setShowReview(false)}
          onComplete={() => {
            if (activeOrder?.id) handleReviewComplete(activeOrder.id);
          }}
        />
      )}

      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div
          className="text-center mb-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-brand mb-4 relative">
            <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 gradient-brand" />
            <Icon name="ClipboardDocumentListIcon" size={28} className="text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Track Your Orders</h1>
          <p className="text-muted-foreground text-sm">
            {user
              ? 'All your orders are shown below with live status updates.'
              : 'Please sign in to track your order and view status updates.'}
          </p>
        </div>

        {/* LOGGED-IN VIEW */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 xl:col-span-3">
              <div
                className="bg-card rounded-2xl border border-border overflow-hidden sticky top-6"
                style={{ boxShadow: 'var(--shadow-3d)' }}
              >
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-foreground">My Orders</h2>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Icon name="ClockIcon" size={14} />
                    {showHistory ? 'View Tracking' : 'View History'}
                  </button>
                </div>
                {myOrdersLoading && (
                  <div className="p-4 space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded-xl" />
                    ))}
                  </div>
                )}
                {!myOrdersLoading && myOrders.length === 0 && (
                  <div className="text-center py-12 px-4">
                    <Icon name="ClipboardDocumentListIcon" size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">No orders yet.</p>
                    <Link href="/menu-browse-screen" className="text-xs text-primary font-medium mt-1 inline-block hover:underline">
                      Browse our menu →
                    </Link>
                  </div>
                )}
                {!myOrdersLoading && myOrders.length > 0 && (
                  <div className="divide-y divide-border max-h-[calc(100vh-220px)] overflow-y-auto">
                    {myOrders.map((o) => {
                      const norm = normalizeStatus(o.status);
                      const badge = STATUS_BADGE[norm] || STATUS_BADGE.pending;
                      const isSelected = selectedOrder?.id === o.id;
                      const isReviewed = reviewedOrders.has(o.id);

                      return (
                        <button
                          key={o.id}
                          onClick={() => {
                            setSelectedOrder(o);
                            if (norm === 'completed' && isReviewed) {
                              setShowHistory(true);
                            } else {
                              setShowHistory(false);
                            }
                          }}
                          className={`w-full text-left px-5 py-3.5 transition-all duration-200 hover:bg-muted/50 ${
                            isSelected && !showHistory ? 'bg-primary/5 border-l-4 border-primary' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-xs sm:text-sm font-bold text-primary">{o.order_number}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text}`}>
                              {badge.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                              <span className="capitalize">{norm}</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {new Date(o.created_at).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                              })}
                              {' · '}₱{Number(o.total_amount).toLocaleString()}
                            </span>
                            {isReviewed && (
                              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Reviewed
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8 xl:col-span-9 min-w-0">
              {showHistory ? (
                <OrderHistoryView
                  orders={myOrders}
                  reviewedOrders={reviewedOrders}
                  onSelectOrder={(order) => {
                    setSelectedOrder(order);
                    setShowHistory(false);
                  }}
                />
              ) : !selectedOrder && !myOrdersLoading ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl p-8">
                  <Icon name="CursorArrowRaysIcon" size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">Select an order from the list to view details.</p>
                </div>
              ) : (
                selectedOrder && (
                  <OrderDetail
                    order={selectedOrder}
                    lastUpdated={lastUpdated}
                    progressPercent={progressPercent}
                    formattedEventDate={formattedEventDate}
                    onOpenReview={() => openReviewModal(selectedOrder)}
                    hasReviewed={isCurrentOrderReviewed}
                    onHideOrder={() => setShowHistory(true)}
                  />
                )
              )}
            </div>
          </div>
        )}

        {/* NOT LOGGED IN / GUEST LOCK VIEW */}
        {!user && !authLoading && (
          <div className="max-w-md mx-auto text-center py-16 bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Icon name="LockClosedIcon" size={32} />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Sign In to Track Orders
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              You must be logged in to view your order status and real-time updates.
            </p>
            <Link
              href="/sign-up-login-screen"
              className="inline-flex items-center justify-center w-full px-5 py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all gap-2"
            >
              <Icon name="ArrowLeftOnRectangleIcon" size={18} />
              Sign In to Continue
            </Link>
          </div>
        )}

        {authLoading && (
          <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-48 bg-muted rounded-2xl" />
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetail({
  order,
  lastUpdated,
  progressPercent,
  formattedEventDate,
  onOpenReview,
  hasReviewed,
  onHideOrder,
}: {
  order: Order;
  lastUpdated: Date | null;
  progressPercent: number;
  formattedEventDate: string | null;
  onOpenReview: () => void;
  hasReviewed: boolean;
  onHideOrder?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const prevStatus = useRef(order.status);
  const [statusChanged, setStatusChanged] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (normalizeStatus(prevStatus.current) !== normalizeStatus(order.status)) {
      setStatusChanged(true);
      prevStatus.current = order.status;
      const t = setTimeout(() => setStatusChanged(false), 3000);
      return () => clearTimeout(t);
    }
  }, [order.status]);

  const normStatus = normalizeStatus(order.status);
  const badge = STATUS_BADGE[normStatus] || STATUS_BADGE.pending;

  return (
    <div
      className="space-y-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {statusChanged && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
          <Icon name="ArrowPathIcon" size={18} className="text-green-600" />
          <p className="text-sm font-semibold text-green-700">
            Order status updated to <strong className="capitalize">{normStatus}</strong>!
          </p>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-3d)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Order Number
            </p>
            <div className="flex items-center gap-2">
              <Icon name="HashtagIcon" size={18} className="text-primary" />
              <span className="font-mono text-xl sm:text-2xl font-bold text-primary tracking-wider">{order.order_number}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Placed on{' '}
              {new Date(order.created_at).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text}`}>
              {badge.dot && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
              <span className="capitalize">{normStatus}</span>
            </span>
            {lastUpdated && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live updates active
              </span>
            )}
            {onHideOrder && hasReviewed && (
              <button
                onClick={onHideOrder}
                className="mt-1 px-3 py-1.5 bg-card border border-border hover:bg-muted text-foreground font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Icon name="EyeSlashIcon" size={14} />
                Hide & View Order History
              </button>
            )}
          </div>
        </div>

        {/* Action / Rating section */}
        {normStatus === 'completed' && !hasReviewed && (
          <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-foreground">Order completed! Action Required</p>
              <p className="text-xs text-muted-foreground">Please confirm receipt and rate your experience to finish and hide this active order tracking view.</p>
            </div>
            <button
              onClick={onOpenReview}
              className="px-4 py-2 gradient-brand text-primary-foreground font-semibold text-xs rounded-xl btn-3d transition-all flex items-center gap-1.5"
            >
              <Icon name="StarIcon" size={14} />
              Confirm & Rate Order
            </button>
          </div>
        )}

        {/* Once confirmed & reviewed banner */}
        {normStatus === 'completed' && hasReviewed && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Icon name="CheckCircleIcon" size={20} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Order Confirmed & Reviewed</p>
                <p className="text-xs text-emerald-700">Thank you! Your feedback has been recorded.</p>
              </div>
            </div>
            {onHideOrder && (
              <button
                onClick={onHideOrder}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Icon name="ClockIcon" size={14} />
                Hide & View History
              </button>
            )}
          </div>
        )}

        {/* ORDER TIMELINE */}
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="font-display text-base font-bold text-foreground mb-6 flex items-center gap-2">
            <Icon name="ClockIcon" size={18} className="text-primary" />
            Order Timeline
          </h3>

          <AnimatedProgressBar percent={progressPercent} status={order.status} />
          <StageCard order={order} />

          <div className="space-y-4">
            {TIMELINE_STEPS.map((step) => {
              const state = getStepState(step.status, order.status);
              return (
                <div key={step.status} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: state === 'upcoming' ? 'var(--muted)' : `${step.color}20`,
                      border: `1.5px solid ${state === 'upcoming' ? 'var(--border)' : step.color}`,
                    }}
                  >
                    <Icon
                      name={step.icon as Parameters<typeof Icon>[0]['name']}
                      size={14}
                      style={{ color: state === 'upcoming' ? 'var(--muted-foreground)' : step.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {step.label}
                      </p>
                      <span className="text-xs text-muted-foreground">{step.estimatedTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Grid */}
        <div className="mt-8 border-t border-border pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Icon name="UserIcon" size={14} />
              Customer Information
            </h4>
            <div className="space-y-1.5 text-sm">
              <p className="font-medium text-foreground">{order.customer_name}</p>
              <p className="text-muted-foreground">{order.customer_email}</p>
              <p className="text-muted-foreground">{order.customer_phone}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Icon name="MapPinIcon" size={14} />
              Fulfillment & Payment
            </h4>
            <div className="space-y-1.5 text-sm">
              <p className="text-foreground capitalize">
                <span className="font-semibold">Method:</span> {order.delivery_method}
              </p>
              {order.delivery_address && (
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Address:</span> {order.delivery_address}
                </p>
              )}
              {formattedEventDate && (
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Event Date:</span> {formattedEventDate}
                  {order.event_time ? ` at ${order.event_time}` : ''}
                </p>
              )}
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Payment:</span> {PAYMENT_LABELS[order.payment_method] || order.payment_method}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-8 border-t border-border pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <Icon name="ShoppingBagIcon" size={14} />
            Order Items
          </h4>
          <div className="divide-y divide-border">
            {order.order_items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-sm gap-4">
                <div>
                  <p className="font-medium text-foreground">{item.menu_item_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} × ₱{Number(item.unit_price).toLocaleString()}
                  </p>
                </div>
                <p className="font-semibold text-foreground">₱{Number(item.subtotal).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₱{Number(order.subtotal).toLocaleString()}</span>
            </div>
            {Number(order.delivery_fee) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>₱{Number(order.delivery_fee).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border mt-2">
              <span>Total Amount</span>
              <span className="text-primary">₱{Number(order.total_amount).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderHistoryView({
  orders,
  reviewedOrders,
  onSelectOrder,
}: {
  orders: Order[];
  reviewedOrders: Set<string>;
  onSelectOrder: (order: Order) => void;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-3d)' }}>
      <h2 className="font-display text-xl font-bold text-foreground mb-2 flex items-center gap-2">
        <Icon name="ClockIcon" size={22} className="text-primary" />
        Order History
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        All past completed and reviewed orders are stored here.
      </p>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No order history available.</div>
      ) : (
        <div className="divide-y divide-border">
          {orders.map((o) => {
            const norm = normalizeStatus(o.status);
            const badge = STATUS_BADGE[norm] || STATUS_BADGE.pending;
            const isReviewed = reviewedOrders.has(o.id);

            return (
              <div key={o.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">{o.order_number}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text}`}>
                      <span className="capitalize">{norm}</span>
                    </span>
                    {isReviewed && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Icon name="CheckCircleIcon" size={12} />
                        Reviewed & Confirmed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(o.created_at).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {' · '}
                    {o.order_items?.length || 0} items
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-sm text-foreground">₱{Number(o.total_amount).toLocaleString()}</span>
                  <button
                    onClick={() => onSelectOrder(o)}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}