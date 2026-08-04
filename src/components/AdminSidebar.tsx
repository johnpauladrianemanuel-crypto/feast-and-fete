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
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nav-dashboard', label: 'Dashboard', href: '/admin-dashboard', icon: 'HomeIcon' },
  { id: 'nav-orders', label: 'Orders', href: '/admin-orders', icon: 'ClipboardDocumentListIcon', badge: 4 },
  { id: 'nav-menu', label: 'Menu Items', href: '/admin-menu-items', icon: 'BookOpenIcon' },
  { id: 'nav-inventory', label: 'Inventory', href: '/admin-inventory', icon: 'ArchiveBoxIcon', badge: 3 },
  { id: 'nav-expenses', label: 'Expenses', href: '/admin-expenses', icon: 'BanknotesIcon' },
  { id: 'nav-reports', label: 'Reports', href: '/admin-reports', icon: 'ChartBarIcon' },
  { id: 'nav-customers', label: 'Customers', href: '/admin-customers', icon: 'UsersIcon' },
  { id: 'nav-notifications', label: 'Notifications', href: '/admin-notifications', icon: 'BellIcon', badge: 5 },
  { id: 'nav-settings', label: 'Settings', href: '/admin-settings', icon: 'Cog6ToothIcon' },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
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
          const isActive = pathname === item.href || (item.href === '/admin-dashboard' && pathname === '/admin-dashboard');
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative"
              style={{
                background: isActive ? 'rgba(212,160,23,0.12)' : 'transparent',
                color: isActive ? '#D4A017' : '#C8A99A',
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                name={item.icon as Parameters<typeof Icon>[0]['name']}
                size={18}
                className={isActive ? 'text-secondary' : 'text-admin-muted group-hover:text-secondary transition-colors'}
              />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: isActive ? '#D4A017' : '#C8A99A' }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full"
                      style={{ background: isActive ? '#D4A017' : 'rgba(212,160,23,0.2)', color: isActive ? '#1A0F0A' : '#D4A017' }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary" />
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