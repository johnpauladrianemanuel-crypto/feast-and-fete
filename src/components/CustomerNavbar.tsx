'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { useCart } from '@/lib/cartContext';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function CustomerNavbar() {
  const { totalItems, toggleCart } = useCart();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const supabase = createClient();

  // Initialize dark mode from localStorage
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

  // Fetch unread notification count for logged-in user
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      const { data } = await supabase?.from('orders')?.select('id, status, created_at')?.eq('user_id', user?.id)?.in('status', ['Confirmed', 'Preparing', 'Ready']);

      if (data) {
        setUnreadCount(data?.length);
      }
    };

    fetchUnread();

    const channel = supabase?.channel('navbar_orders_watch')?.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        fetchUnread();
      })?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [user, supabase]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setProfileOpen(false);
      router?.push('/');
    } catch {
      // ignore
    }
  };

  const displayName = user?.user_metadata?.full_name
    ? user?.user_metadata?.full_name?.split(' ')?.map((w) => w?.[0])?.join('')?.slice(0, 2)?.toUpperCase()
    : user?.email?.slice(0, 2)?.toUpperCase() ?? 'MS';

  const firstName = user?.user_metadata?.full_name
    ? user?.user_metadata?.full_name?.split(' ')?.[0]
    : user?.email?.split('@')?.[0] ?? 'Account';

  return (
    <nav className="sticky top-0 z-40 bg-card border-b border-border" style={{ boxShadow: '0 2px 12px rgba(44,24,16,0.08)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <AppLogo size={36} />
            <span className="font-display text-xl font-bold text-primary hidden sm:block" style={{ letterSpacing: '-0.01em' }}>
              Feast & Fête
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/menu-browse-screen" className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-150">
              Browse Menu
            </Link>
            <Link href="/cart-review" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-150">
              My Cart
            </Link>
            <Link href="/order-status" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-150">
              Track Order
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <Link
              href="/customer-notifications"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors duration-150"
              aria-label="Notifications"
            >
              <Icon name="BellIcon" size={22} className="text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 gradient-brand text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors duration-150"
              aria-label="Open cart"
            >
              <Icon name="ShoppingCartIcon" size={22} className="text-foreground" />
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
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-colors duration-150"
                  >
                    <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">{displayName}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{firstName}</span>
                    <Icon name="ChevronDownIcon" size={16} className="text-muted-foreground" />
                  </button>
                  {profileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl py-1 z-50 animate-fade-in"
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
                      {/* Dark Mode Toggle */}
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity duration-150"
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={16} className="text-primary-foreground" />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Icon name={mobileOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 animate-fade-in">
            <Link href="/menu-browse-screen" className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              <Icon name="BookOpenIcon" size={18} className="text-primary" />
              Browse Menu
            </Link>
            <Link href="/customer-orders" className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              <Icon name="ClipboardDocumentListIcon" size={18} className="text-primary" />
              My Orders
            </Link>
            <Link href="/customer-notifications" className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              <Icon name="BellIcon" size={18} className="text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto w-5 h-5 gradient-brand text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link href="/customer-profile" className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              <Icon name="UserIcon" size={18} className="text-primary" />
              My Profile
            </Link>
            {/* Mobile Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Icon name={isDarkMode ? 'SunIcon' : 'MoonIcon'} size={18} className="text-primary" />
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              <span className={`ml-auto w-8 h-4 rounded-full transition-colors duration-200 flex items-center px-0.5 ${isDarkMode ? 'bg-primary' : 'bg-border'}`}>
                <span className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}