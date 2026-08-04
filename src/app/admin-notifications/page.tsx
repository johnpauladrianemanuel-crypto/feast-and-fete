'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
  AdminNotification,
} from '@/lib/supabase/services';
import Icon from '@/components/ui/AppIcon';

const TYPE_STYLES: Record<AdminNotification['type'], { icon: string; color: string; bg: string }> = {
  order: { icon: 'ClipboardDocumentListIcon', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  payment: { icon: 'BanknotesIcon', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
  inventory: { icon: 'ArchiveBoxIcon', color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
  system: { icon: 'InformationCircleIcon', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
};

type FilterType = 'All' | AdminNotification['type'];

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

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminNotifications();
      setNotifications(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    try {
      await markAdminNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // silently fail
    }
  };

  const markAllRead = async () => {
    try {
      await markAllAdminNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      // silently fail
    }
  };

  const filtered = notifications.filter(n => filter === 'All' || n.type === filter);

  const filterCounts: Record<FilterType, number> = {
    All: notifications.length,
    order: notifications.filter(n => n.type === 'order').length,
    payment: notifications.filter(n => n.type === 'payment').length,
    inventory: notifications.filter(n => n.type === 'inventory').length,
    system: notifications.filter(n => n.type === 'system').length,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminTopbar />
        <div className="px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>Notifications</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                {loading ? 'Loading…' : unreadCount > 0 ? <span style={{ color: '#D4A017' }}>{unreadCount} unread</span> : 'All caught up!'} {!loading && `· ${notifications.length} total`}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'var(--admin-surface)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)' }}>
                <Icon name="CheckIcon" size={14} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['All', 'order', 'payment', 'inventory', 'system'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize"
                style={{ background: filter === f ? '#D4A017' : 'var(--admin-surface)', color: filter === f ? '#1A0F0A' : 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}
              >
                {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({filterCounts[f]})
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl" style={{ background: 'var(--admin-surface)' }} />)}
            </div>
          )}

          {/* Notifications List */}
          {!loading && (
            <div className="space-y-2">
              {filtered.map(notif => {
                const style = TYPE_STYLES[notif.type];
                return (
                  <div
                    key={notif.id}
                    className="flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer group"
                    style={{ background: notif.read ? 'var(--admin-surface)' : 'rgba(212,160,23,0.06)', border: `1px solid ${notif.read ? 'var(--admin-border)' : 'rgba(212,160,23,0.2)'}` }}
                    onClick={() => markRead(notif.id)}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: style.bg }}>
                      <Icon name={style.icon as Parameters<typeof Icon>[0]['name']} size={18} style={{ color: style.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: '#F5EDE0' }}>{notif.title}</p>
                        {!notif.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#D4A017' }} />}
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--admin-muted)' }}>{notif.message}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--admin-muted)', opacity: 0.7 }}>{timeAgo(notif.created_at)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(notif.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-500/10 flex-shrink-0"
                      style={{ color: 'var(--admin-muted)' }}
                    >
                      <Icon name="XMarkIcon" size={14} />
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-16" style={{ color: 'var(--admin-muted)' }}>
                  <Icon name="BellIcon" size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notifications in this category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
