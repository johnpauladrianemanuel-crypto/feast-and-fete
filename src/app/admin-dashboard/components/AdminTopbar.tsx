'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  AdminNotification,
} from '@/lib/supabase/services';
import { createClient } from '@/lib/supabase/client';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function getNotificationIcon(type: AdminNotification['type']): string {
  switch (type) {
    case 'order':
      return '🛒';
    case 'payment':
      return '💳';
    case 'inventory':
      return '⚠️';
    case 'system':
    default:
      return 'ℹ️';
  }
}

export default function AdminTopbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchAdminNotifications();
      setNotifications(data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel('admin_topbar_notifications_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          const newNotif = payload.new as AdminNotification;
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await markAdminNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAdminNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  };

  return (
    <header
      className="flex items-center justify-between px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 sticky top-0 z-30"
      style={{
        background: 'var(--admin-surface)',
        borderBottom: '1px solid var(--admin-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--admin-muted)' }}>
        <span className="font-medium" style={{ color: '#F5EDE0' }}>Dashboard</span>
        <Icon name="ChevronRightIcon" size={14} className="text-admin-muted" />
        <span>Overview</span>
      </div>
      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: 'var(--admin-muted)' }}>
          <Icon name="MagnifyingGlassIcon" size={14} />
          <span>Search orders…</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>⌘K</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
            style={{ background: notifOpen ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)' }}
            aria-label="Notifications"
          >
            <Icon name="BellIcon" size={16} style={{ color: '#C8A99A' }} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-secondary" />}
          </button>
          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-2xl py-2 z-50 animate-fade-in"
              style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <div className="px-4 py-2 flex items-center justify-between border-b" style={{ borderColor: 'var(--admin-border)' }}>
                <span className="text-sm font-semibold" style={{ color: '#F5EDE0' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs px-2 py-0.5 rounded-full font-bold transition-opacity hover:opacity-80" style={{ background: 'rgba(212,160,23,0.15)', color: '#D4A017' }}>
                    {unreadCount} new
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.slice(0, 5).map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-white/5"
                    style={{ background: !n.read ? 'rgba(212,160,23,0.04)' : 'transparent' }}
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{getNotificationIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug" style={{ color: !n.read ? '#F5EDE0' : 'var(--admin-muted)' }}>
                        {n.title}: {n.message}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--admin-muted)' }}>
                    No notifications
                  </div>
                )}
              </div>
              <div className="px-4 pt-2 border-t" style={{ borderColor: 'var(--admin-border)' }}>
                <Link
                  href="/admin-notifications"
                  onClick={() => setNotifOpen(false)}
                  className="block w-full text-center text-xs font-semibold py-2 rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: '#D4A017' }}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Customer site */}
        <Link
          href="/menu-browse-screen"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: 'var(--admin-muted)' }}
        >
          <Icon name="ArrowTopRightOnSquareIcon" size={13} />
          Customer Site
        </Link>
      </div>
    </header>
  );
}