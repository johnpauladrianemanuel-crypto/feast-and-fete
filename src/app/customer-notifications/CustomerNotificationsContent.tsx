'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';

interface CustomerNotification {
  id: string;
  order_id: string;
  order_number: string;
  type: 'status_update' | 'order_placed' | 'order_ready' | 'order_completed' | 'order_cancelled';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

const STATUS_MESSAGES: Record<OrderStatus, { title: string; message: (orderNum: string) => string; icon: string; color: string; bg: string }> = {
  Pending: {
    title: 'Order Received',
    message: (n) => `Your order ${n} has been received and is being reviewed.`,
    icon: 'ClipboardDocumentCheckIcon',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
  },
  Confirmed: {
    title: 'Order Confirmed',
    message: (n) => `Great news! Your order ${n} has been confirmed. We're getting ready to prepare it.`,
    icon: 'CheckBadgeIcon',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
  },
  Preparing: {
    title: 'Now Preparing Your Order',
    message: (n) => `Our chefs are now preparing your order ${n}. Your Filipino food trays are being cooked with care!`,
    icon: 'FireIcon',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
  },
  Ready: {
    title: 'Order Ready!',
    message: (n) => `Your order ${n} is ready for pickup/delivery. We'll be in touch shortly!`,
    icon: 'TruckIcon',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
  },
  Completed: {
    title: 'Order Completed',
    message: (n) => `Your order ${n} has been completed. Thank you for choosing Feast & Fête!`,
    icon: 'CheckCircleIcon',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
  },
  Cancelled: {
    title: 'Order Cancelled',
    message: (n) => `Your order ${n} has been cancelled. Please contact us if you have any questions.`,
    icon: 'XCircleIcon',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
  },
};

function buildNotificationsFromOrders(orders: Order[]): CustomerNotification[] {
  const notifications: CustomerNotification[] = [];

  orders.forEach((order) => {
    // Always add "order placed" notification
    notifications.push({
      id: `placed-${order.id}`,
      order_id: order.id,
      order_number: order.order_number,
      type: 'order_placed',
      title: 'Order Placed Successfully',
      message: `Your order ${order.order_number} has been placed for ₱${Number(order.total_amount).toLocaleString()}. We'll notify you as it progresses.`,
      read: true,
      created_at: order.created_at,
    });

    // Add status-based notification for current status (if not Pending)
    const statusesToNotify: OrderStatus[] = ['Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
    if (statusesToNotify.includes(order.status)) {
      const info = STATUS_MESSAGES[order.status];
      notifications.push({
        id: `status-${order.id}-${order.status}`,
        order_id: order.id,
        order_number: order.order_number,
        type: 'status_update',
        title: info.title,
        message: info.message(order.order_number),
        read: ['Completed', 'Cancelled'].includes(order.status),
        created_at: order.updated_at,
      });
    }
  });

  // Sort by date descending
  return notifications.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function CustomerNotificationsContent() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const built = buildNotificationsFromOrders(data as Order[]);
        setNotifications(built);
      }
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  // Real-time: re-fetch when any of user's orders update
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customer_orders_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchOrders]);

  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const isRead = (n: CustomerNotification) => n.read || readIds.has(n.id);
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />

      <div className="max-w-2xl mx-auto px-4 py-10 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                <Icon name="BellIcon" size={20} className="text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full gradient-brand text-primary-foreground text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground ml-13">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground"
            >
              <Icon name="CheckIcon" size={14} />
              Mark all read
            </button>
          )}
        </div>

        {/* Auth loading */}
        {authLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-2xl" />)}
          </div>
        )}

        {/* Not logged in */}
        {!authLoading && !user && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Icon name="BellSlashIcon" size={28} className="text-muted-foreground" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground mb-2">Sign in to see notifications</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Get real-time updates about your orders — confirmations, preparation status, and more.
            </p>
            <Link
              href="/sign-up-login-screen"
              className="inline-flex items-center gap-2 px-6 py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all"
            >
              <Icon name="UserCircleIcon" size={16} />
              Sign In
            </Link>
          </div>
        )}

        {/* Loading */}
        {!authLoading && user && loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-muted rounded-2xl" />)}
          </div>
        )}

        {/* Empty state */}
        {!authLoading && user && !loading && notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Icon name="BellIcon" size={28} className="text-muted-foreground opacity-40" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground mb-2">No notifications yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Place an order and we'll notify you every step of the way.
            </p>
            <Link
              href="/menu-browse-screen"
              className="inline-flex items-center gap-2 px-6 py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all"
            >
              <Icon name="BookOpenIcon" size={16} />
              Browse Menu
            </Link>
          </div>
        )}

        {/* Notifications List */}
        {!authLoading && user && !loading && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const statusKey = notif.type === 'order_placed' ? 'Pending' : (
                Object.keys(STATUS_MESSAGES).find(
                  (k) => STATUS_MESSAGES[k as OrderStatus].title === notif.title
                ) as OrderStatus | undefined
              );
              const style = statusKey
                ? STATUS_MESSAGES[statusKey]
                : { icon: 'BellIcon', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' };

              const read = isRead(notif);

              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer group border ${
                    read
                      ? 'bg-card border-border' :'bg-primary/5 border-primary/20'
                  }`}
                  style={{ boxShadow: read ? 'none' : '0 0 0 1px rgba(var(--primary-rgb),0.1)' }}
                  onClick={() => markRead(notif.id)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: style.bg }}
                  >
                    <Icon
                      name={style.icon as Parameters<typeof Icon>[0]['name']}
                      size={18}
                      style={{ color: style.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                      {!read && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0 gradient-brand" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs text-muted-foreground opacity-70">{timeAgo(notif.created_at)}</p>
                      <Link
                        href="/order-status"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        View order →
                      </Link>
                    </div>
                  </div>
                  {!read && (
                    <div className="w-2 h-2 rounded-full gradient-brand flex-shrink-0 mt-1.5" />
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
