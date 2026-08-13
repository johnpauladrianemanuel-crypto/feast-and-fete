'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { useCart } from '@/lib/cartContext';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

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

export default function CustomerNavbar() {
  const { totalItems, toggleCart } = useCart();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(null);
  const [dbFullName, setDbFullName] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')?.matches;
    const shouldBeDark = saved === 'dark' || (!saved && prefersDark);
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement?.classList?.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement?.classList?.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      setDbAvatarUrl(null);
      setDbFullName(null);
      return;
    }

    const fetchUserProfile = async () => {
      const { data } = await supabase
        ?.from('user_profiles')
        ?.select('avatar_url, full_name')
        ?.eq('id', user.id)
        ?.single();

      if (data) {
        if (data.avatar_url) {
          const freshUrl = `${data.avatar_url}${data.avatar_url.includes('?') ? '&' : '?'}t=${Date.now()}`;
          setDbAvatarUrl(freshUrl);
        } else {
          setDbAvatarUrl(null);
        }
        setDbFullName(data.full_name || null);
      }
    };

    fetchUserProfile();

    const channel = supabase
      ?.channel(`navbar_profile_watch_${user.id}`)
      ?.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload?.new) {
            const rawUrl = payload.new.avatar_url;
            setDbAvatarUrl(rawUrl ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : null);
            setDbFullName(payload.new.full_name || null);
          }
        }
      )
      ?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [user, supabase]);

  const fetchOrdersAndNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const built = buildNotificationsFromOrders(data as Order[]);
      setNotifications(built);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchOrdersAndNotifications();
  }, [fetchOrdersAndNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('navbar_customer_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrdersAndNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchOrdersAndNotifications]);

  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const isRead = (n: CustomerNotification) => n.read || readIds.has(n.id);
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  const handleSignOut = async () => {
    try {
      await signOut();
      setProfileOpen(false);
      setNotificationsOpen(false);
      router?.push('/');
    } catch {
      // ignore
    }
  };

  const avatarUrl = dbAvatarUrl || user?.avatar_url || user?.photoURL || user?.user_metadata?.avatar_url || user?.user_metadata?.photoURL;
  const rawName = dbFullName || user?.user_metadata?.full_name || user?.name;

  const displayName = rawName
    ? rawName?.split(' ')?.map((w: string) => w?.[0])?.join('')?.slice(0, 2)?.toUpperCase()
    : user?.email?.slice(0, 2)?.toUpperCase() ?? 'MS';

  const firstName = rawName
    ? rawName?.split(' ')?.[0]
    : user?.email?.split('@')?.[0] ?? 'Account';

  return (
    <nav className="sticky top-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10 transition-all duration-200" ref={dropdownRef}>
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Gold Brand Text */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <AppLogo size={36} />
            <span 
              className="font-display text-xl font-bold bg-gradient-to-r from-[#FFF0B3] via-[#FFD700] to-[#E6A100] bg-clip-text text-transparent hidden sm:block" 
              style={{ letterSpacing: '-0.01em' }}
            >
              Feast & Fête
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/menu-browse-screen" className="text-sm font-medium text-white/90 hover:text-white transition-colors duration-150">
              Menu
            </Link>
            <Link href="/cart-review" className="text-sm font-medium text-white/80 hover:text-white transition-colors duration-150">
              My Cart
            </Link>
            <Link href="/order-status" className="text-sm font-medium text-white/80 hover:text-white transition-colors duration-150">
              Track Order
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-colors duration-150 text-white"
                aria-label="Notifications"
              >
                <Icon name="BellIcon" size={22} className="text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 gradient-brand text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl py-2 z-50 animate-fade-in text-foreground"
                  style={{ boxShadow: 'var(--shadow-3d)' }}
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold gradient-brand text-primary-foreground">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => {
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
                            onClick={() => markRead(notif.id)}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                              !read ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: style.bg }}
                            >
                              <Icon
                                name={style.icon as Parameters<typeof Icon>[0]['name']}
                                size={16}
                                style={{ color: style.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                                {!read && (
                                  <span className="w-2 h-2 rounded-full flex-shrink-0 gradient-brand" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                                {notif.message}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] text-muted-foreground opacity-70">
                                  {timeAgo(notif.created_at)}
                                </span>
                                <Link
                                  href="/order-status"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNotificationsOpen(false);
                                  }}
                                  className="text-[11px] text-primary font-medium hover:underline"
                                >
                                  View order →
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No notifications yet.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-2 text-center">
                    <Link
                      href="/customer-notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-medium text-primary hover:underline block py-1"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-colors duration-150 text-white"
              aria-label="Open cart"
            >
              <Icon name="ShoppingCartIcon" size={22} className="text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 gradient-brand text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative hidden md:block">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors duration-150 text-white"
                  >
                    <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary-foreground text-xs font-bold">{displayName}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-white">{firstName}</span>
                    <Icon name="ChevronDownIcon" size={16} className="text-white/80" />
                  </button>
                  {profileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl py-1 z-50 animate-fade-in text-foreground"
                      style={{ boxShadow: 'var(--shadow-3d)' }}
                    >
                      <Link href="/customer-profile" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors" onClick={() => setProfileOpen(false)}>
                        <Icon name="UserIcon" size={16} className="text-muted-foreground" />
                        My Profile
                      </Link>
                      <Link href="/customer-orders" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors" onClick={() => setProfileOpen(false)}>
                        <Icon name="ClipboardDocumentListIcon" size={16} className="text-muted-foreground" />
                        My Orders
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Icon name={isDarkMode ? 'SunIcon' : 'MoonIcon'} size={16} className="text-muted-foreground" />
                        <span className="flex-1 text-left">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        <span className={`w-8 h-4 rounded-full transition-colors duration-200 flex items-center px-0.5 ${isDarkMode ? 'bg-primary' : 'bg-border'}`}>
                          <span className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </span>
                      </button>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-muted transition-colors"
                      >
                        <Icon name="ArrowRightOnRectangleIcon" size={16} className="text-error" />
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/sign-up-login-screen"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity duration-150 shadow-md"
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={16} className="text-primary-foreground" />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-colors text-white"
              aria-label="Open menu"
            >
              <Icon name={mobileOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 py-3 animate-fade-in bg-black/80 backdrop-blur-lg rounded-b-2xl px-2">
            <Link href="/menu-browse-screen" className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
              <Icon name="BookOpenIcon" size={18} className="text-white" />
              Menu
            </Link>
            <Link href="/customer-orders" className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
              <Icon name="ClipboardDocumentListIcon" size={18} className="text-white" />
              My Orders
            </Link>
            <Link href="/customer-notifications" className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
              <Icon name="BellIcon" size={18} className="text-white" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto w-5 h-5 gradient-brand text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link href="/customer-profile" className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
              <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName}</span>
                )}
              </div>
              My Profile
            </Link>
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <Icon name={isDarkMode ? 'SunIcon' : 'MoonIcon'} size={18} className="text-white" />
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              <span className={`ml-auto w-8 h-4 rounded-full transition-colors duration-200 flex items-center px-0.5 ${isDarkMode ? 'bg-primary' : 'bg-border'}`}>
                <span className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </span>
            </button>
            {user && (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-white/10 transition-colors mt-2 border-t border-white/10 pt-3"
              >
                <Icon name="ArrowRightOnRectangleIcon" size={18} className="text-error" />
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}