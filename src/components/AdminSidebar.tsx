'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nav-dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: 'HomeIcon' },
  { id: 'nav-orders', label: 'Orders', href: '/admin-orders', icon: 'ClipboardDocumentListIcon' },
  { id: 'nav-menu', label: 'Menu Items', href: '/admin-menu-items', icon: 'BookOpenIcon' },
  { id: 'nav-inventory', label: 'Inventory', href: '/admin-inventory', icon: 'ArchiveBoxIcon' },
  { id: 'nav-expenses', label: 'Expenses', href: '/admin-expenses', icon: 'BanknotesIcon' },
  { id: 'nav-customers', label: 'Customers', href: '/admin-customers', icon: 'UsersIcon' },
  { id: 'nav-notifications', label: 'Notifications', href: '/admin-notifications', icon: 'BellIcon' },
  { id: 'nav-settings', label: 'Settings', href: '/admin-settings', icon: 'Cog6ToothIcon' },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved !== 'light';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, []);

  // Fetch pending/active orders count with auto-refresh
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' });
        if (!res.ok) return;

        const result = await res.json();
        const ordersArray = result.orders || result.data || (Array.isArray(result) ? result : []);

        if (!Array.isArray(ordersArray)) return;

        // Count orders that are in Pending status (case-insensitive)
        const count = ordersArray.filter((o: any) => {
          const status = String(o.status || o.order_status || '').trim().toLowerCase();
          return status !== 'completed' && status !== 'cancelled' && status !== 'delivered';
        }).length;

        setPendingOrdersCount(count);
      } catch (err) {
        console.error('Error fetching pending orders count:', err);
      }
    };

    fetchPendingOrders();

    const interval = setInterval(fetchPendingOrders, 4000);
    return () => clearInterval(interval);
  }, [pathname]);

  const toggleTheme = () => {
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

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: collapsed ? 64 : 240,
        background: 'var(--admin-surface)',
        borderRight: '1px solid var(--admin-border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--admin-border)', minHeight: 64 }}>
        <AppLogo size={32} />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-display text-sm font-bold text-secondary leading-tight truncate">Feast & Fête</p>
            <p className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          const isOrdersNav = item.id === 'nav-orders';

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 group relative"
              style={{
                background: isActive ? 'rgba(212,160,23,0.12)' : 'transparent',
                color: isActive ? '#D4A017' : '#C8A99A',
              }}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Icon
                  name={item.icon as Parameters<typeof Icon>[0]['name']}
                  size={18}
                  className={isActive ? 'text-secondary flex-shrink-0' : 'text-admin-muted group-hover:text-secondary transition-colors flex-shrink-0'}
                />
                {!collapsed && (
                  <span className="text-sm font-medium truncate" style={{ color: isActive ? '#D4A017' : '#C8A99A' }}>
                    {item.label}
                  </span>
                )}
              </div>

              {/* Order Count Badge */}
              {isOrdersNav && pendingOrdersCount > 0 && (
                <>
                  {!collapsed ? (
                    <span
                      className="ml-2 flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: '#D4A017',
                        color: '#1A0F0A',
                      }}
                    >
                      {pendingOrdersCount}
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-background" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t px-2 py-3 space-y-1" style={{ borderColor: 'var(--admin-border)' }}>
        {/* Customer site link */}
        <Link
          href="/menu-browse-screen"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group"
          style={{ color: 'var(--admin-muted)' }}
          title={collapsed ? 'Customer Site' : undefined}
        >
          <Icon name="ArrowTopRightOnSquareIcon" size={18} className="text-admin-muted group-hover:text-secondary transition-colors" />
          {!collapsed && <span className="text-sm font-medium" style={{ color: 'var(--admin-muted)' }}>Customer Site</span>}
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full group"
          style={{ color: 'var(--admin-muted)' }}
          title={collapsed ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : undefined}
          aria-label="Toggle theme"
        >
          <Icon
            name={isDarkMode ? 'SunIcon' : 'MoonIcon'}
            size={18}
            className="text-admin-muted group-hover:text-secondary transition-colors flex-shrink-0"
          />
          {!collapsed && (
            <div className="flex items-center justify-between flex-1">
              <span className="text-sm font-medium" style={{ color: 'var(--admin-muted)' }}>
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
              <span className={`w-8 h-4 rounded-full transition-colors duration-200 flex items-center px-0.5 ${isDarkMode ? 'bg-secondary/40' : 'bg-secondary'}`}>
                <span className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${isDarkMode ? 'translate-x-0' : 'translate-x-4'}`} />
              </span>
            </div>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full group"
          style={{ color: 'var(--admin-muted)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon
            name={collapsed ? 'ChevronRightIcon' : 'ChevronLeftIcon'}
            size={18}
            className="text-admin-muted group-hover:text-secondary transition-colors"
          />
          {!collapsed && <span className="text-sm font-medium" style={{ color: 'var(--admin-muted)' }}>Collapse</span>}
        </button>

        {/* Admin user */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 gradient-brand">
            <span className="text-xs font-bold text-primary-foreground">FF</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-secondary truncate">Admin</p>
              <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>feast.fete@gmail.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}