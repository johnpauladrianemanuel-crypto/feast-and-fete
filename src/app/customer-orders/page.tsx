'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import ReviewModal from '@/app/components/ReviewModal';
import { useCart } from '@/lib/cartContext';

type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';

interface OrderItem {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_address: string | null;
  event_date: string | null;
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

interface ReviewableItem {
  menuItemId: string;
  menuItemName: string;
  orderId?: string;
}

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  Pending: { badge: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  Confirmed: { badge: 'bg-blue-100 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
  Preparing: { badge: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  Ready: { badge: 'bg-primary/10 text-primary border border-primary/20', dot: 'bg-primary' },
  Completed: { badge: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500' },
  Cancelled: { badge: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500' },
};

const PAYMENT_LABELS: Record<string, string> = {
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash on Pickup',
  cash_on_delivery: 'Cash on Delivery',
  card: 'Credit / Debit Card',
};

const FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Orders', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

export default function CustomerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { addItem, toggleCart } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Review modal state
  const [reviewItems, setReviewItems] = useState<ReviewableItem[]>([]);
  const [reviewerName, setReviewerName] = useState('');
  const [showReview, setShowReview] = useState(false);
  // Track which orders have been reviewed this session
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-up-login-screen');
    }
  }, [user, authLoading, router]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setOrders(data as Order[]);
      }
    } finally {
      setOrdersLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['Completed', 'Cancelled'].includes(order.status);
    return order.status === filter;
  });

  const activeCount = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === 'Completed').length;
  const totalSpent = orders.filter(o => o.status === 'Completed').reduce((s, o) => s + (o.total_amount || 0), 0);

  function openReviewModal(order: Order) {
    const items: ReviewableItem[] = (order.order_items || []).map(item => ({
      menuItemId: item.menu_item_id,
      menuItemName: item.menu_item_name,
      orderId: order.id,
    }));
    setReviewItems(items);
    setReviewerName(order.customer_name || user?.email || 'Customer');
    setShowReview(true);
  }

  function handleReviewComplete(orderId: string) {
    setReviewedOrders(prev => new Set(prev).add(orderId));
    setShowReview(false);
  }

  async function handleReorder(order: Order) {
    setReorderingId(order.id);
    try {
      const itemIds = (order.order_items || []).map(i => i.menu_item_id);
      // Fetch from Supabase only
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .in('id', itemIds)
        .eq('is_active', true);

      const fetchedItems = data || [];

      for (const orderItem of order.order_items || []) {
        const dbItem = fetchedItems.find((m: Record<string, unknown>) => m.id === orderItem.menu_item_id);

        if (dbItem) {
          const menuItem = {
            id: dbItem.id as string,
            name: dbItem.name as string,
            category: dbItem.category as string,
            categorySlug: (dbItem.category_slug as string) || '',
            description: (dbItem.description as string) || '',
            price: Number(dbItem.price),
            servingSize: (dbItem.serving_size as string) || '',
            image: (dbItem.image as string) || '',
            imageAlt: (dbItem.image_alt as string) || dbItem.name as string,
            isActive: dbItem.is_active as boolean,
            stock: Number(dbItem.stock),
            soldCount: Number(dbItem.sold_count),
            featured: dbItem.featured as boolean,
          };
          for (let q = 0; q < orderItem.quantity; q++) {
            addItem(menuItem);
          }
        }
        // If item no longer exists in DB (discontinued), skip it silently
      }
      toggleCart();
    } finally {
      setReorderingId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />

      {showReview && reviewItems.length > 0 && (
        <ReviewModal
          items={reviewItems}
          reviewerName={reviewerName}
          userId={user.id}
          onClose={() => setShowReview(false)}
          onComplete={() => {
            const orderId = reviewItems[0]?.orderId;
            if (orderId) handleReviewComplete(orderId);
          }}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/customer-profile" className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeftIcon" size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order History</h1>
            <p className="text-sm text-muted-foreground">All your past and active orders</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Orders</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-2xl font-bold text-amber-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-2xl font-bold text-primary">₱{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Spent</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === opt.value
                  ? 'gradient-brand text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
              {opt.value === 'active' && activeCount > 0 && (
                <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {ordersLoading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading orders…</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="ShoppingBagIcon" size={28} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {filter === 'all' ? 'No orders yet' : `No ${filter === 'active' ? 'active' : filter.toLowerCase()} orders`}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {filter === 'all' ? 'Your order history will appear here once you place your first order.' : 'Try a different filter to see your orders.'}
            </p>
            {filter === 'all' && (
              <Link
                href="/menu-browse-screen"
                className="inline-flex items-center gap-2 px-5 py-2.5 gradient-brand text-white text-sm font-semibold rounded-xl hover:opacity-90 transition"
              >
                <Icon name="BookOpenIcon" size={16} className="text-white" />
                Browse Menu
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const isExpanded = expandedId === order.id;
              const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.Pending;
              const isActive = !['Completed', 'Cancelled'].includes(order.status);
              const isCompleted = order.status === 'Completed';
              const alreadyReviewed = reviewedOrders.has(order.id);

              return (
                <div
                  key={order.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden transition-all"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  {/* Order Header Row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusStyle.dot}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">#{order.order_number}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle.badge}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-PH', {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          })}
                          {' · '}
                          {order.delivery_method === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-foreground">₱{order.total_amount?.toLocaleString()}</span>
                      <Icon
                        name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                        size={16}
                        className="text-muted-foreground"
                      />
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                      {/* Order Items */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items Ordered</p>
                          <div className="space-y-1.5">
                            {order.order_items.map(item => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-foreground">
                                  <span className="font-medium text-primary">{item.quantity}×</span>{' '}
                                  {item.menu_item_name}
                                </span>
                                <span className="text-muted-foreground">₱{item.subtotal?.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment & Delivery Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">Payment</p>
                          <p className="text-sm font-medium text-foreground">
                            {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                          </p>
                        </div>
                        <div className="bg-muted rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">Delivery Fee</p>
                          <p className="text-sm font-medium text-foreground">
                            {order.delivery_fee > 0 ? `₱${order.delivery_fee.toLocaleString()}` : 'Free'}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.delivery_address && (
                        <div className="bg-muted rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">Delivery Address</p>
                          <p className="text-sm text-foreground">{order.delivery_address}</p>
                        </div>
                      )}

                      {/* Event Date */}
                      {order.event_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon name="CalendarDaysIcon" size={14} className="text-primary" />
                          <span>Event: {new Date(order.event_date).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}

                      {/* Notes */}
                      {order.notes && (
                        <div className="bg-muted rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm text-foreground">{order.notes}</p>
                        </div>
                      )}

                      {/* Total Breakdown */}
                      <div className="border-t border-border pt-3 space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Subtotal</span>
                          <span>₱{order.subtotal?.toLocaleString()}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Delivery Fee</span>
                            <span>₱{order.delivery_fee?.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                          <span>Total</span>
                          <span>₱{order.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-1">
                        {isActive && (
                          <Link
                            href={`/order-status?order=${order.order_number}`}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 gradient-brand text-white text-sm font-semibold rounded-xl hover:opacity-90 transition"
                          >
                            <Icon name="TruckIcon" size={15} className="text-white" />
                            Track Order
                          </Link>
                        )}
                        {isCompleted && !alreadyReviewed && order.order_items?.length > 0 && (
                          <button
                            onClick={() => openReviewModal(order)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 gradient-brand text-white text-sm font-semibold rounded-xl hover:opacity-90 transition"
                          >
                            <Icon name="StarIcon" size={15} className="text-white" />
                            Rate Items
                          </button>
                        )}
                        {isCompleted && alreadyReviewed && (
                          <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-100 text-green-700 text-sm font-medium rounded-xl border border-green-200">
                            <Icon name="CheckCircleIcon" size={15} className="text-green-600" />
                            Reviewed
                          </div>
                        )}
                        {/* Quick Reorder Button */}
                        {(isCompleted || order.status === 'Cancelled') && order.order_items?.length > 0 && (
                          <button
                            onClick={() => handleReorder(order)}
                            disabled={reorderingId === order.id}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 border border-primary/20 text-primary text-sm font-semibold rounded-xl hover:bg-primary/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {reorderingId === order.id ? (
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Icon name="ArrowPathIcon" size={15} className="text-primary" />
                            )}
                            Reorder
                          </button>
                        )}
                        <Link
                          href={`/order-status?order=${order.order_number}`}
                          className={`flex items-center justify-center gap-2 py-2.5 px-4 border border-border text-sm font-medium text-foreground rounded-xl hover:bg-muted transition ${isActive || isCompleted ? '' : 'flex-1'}`}
                        >
                          <Icon name="EyeIcon" size={15} className="text-muted-foreground" />
                          {isActive ? 'Details' : 'View'}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
