'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  STATUS_MESSAGES,
  buildNotificationsFromOrders,
  timeAgo,
  type CustomerNotification,
  type Order,
  type OrderStatus,
} from './CustomerNotificationsContent';

export default function NotificationsList() {
  const { user } = useAuth();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const [orders, announcements] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, updated_at, notes')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('menu_announcements')
        .select('id, menu_item_name, message, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const orderItems = orders.data ? buildNotificationsFromOrders(orders.data as Order[]) : [];
    const menuItems: CustomerNotification[] = (announcements.data || []).map((a) => ({
      id: `menu-${a.id}`,
      type: 'new_menu',
      title: 'New menu item added!',
      message: a.message || `${a.menu_item_name} is now on the menu. Come and see!`,
      read: false,
      created_at: a.created_at,
      href: '/menu-browse-screen',
    }));

    setNotifications(
      [...orderItems, ...menuItems].sort(
        (x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime()
      )
    );
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'menu_announcements' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, load]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-1">Notifications</h1>
      <p className="text-sm text-muted-foreground mb-6">Order updates and new menu announcements.</p>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground bg-card border border-border rounded-2xl">
          No notifications yet.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {notifications.map((n) => {
            const statusKey =
              n.type === 'order_placed'
                ? 'Pending'
                : (Object.keys(STATUS_MESSAGES).find(
                    (k) => STATUS_MESSAGES[k as OrderStatus].title === n.title
                  ) as OrderStatus | undefined);
            const style =
              n.type === 'new_menu'
                ? { icon: 'SparklesIcon', color: '#A94725', bg: 'rgba(169,71,37,0.12)' }
                : statusKey
                ? STATUS_MESSAGES[statusKey]
                : { icon: 'BellIcon', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' };
            return (
              <div key={n.id} className="flex items-start gap-3 px-4 py-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: style.bg }}
                >
                  <Icon
                    name={style.icon as Parameters<typeof Icon>[0]['name']}
                    size={20}
                    style={{ color: style.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                  <Link
                    href={n.href || '/order-status'}
                    className="text-xs text-primary font-medium hover:underline mt-1.5 inline-block"
                  >
                    {n.type === 'new_menu' ? 'Explore menu →' : 'View order →'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
