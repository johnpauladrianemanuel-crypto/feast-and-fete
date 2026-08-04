'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function AdminTopbar() {
  const [notifOpen, setNotifOpen] = useState(false);

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
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
            style={{ background: notifOpen ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)' }}
            aria-label="Notifications"
          >
            <Icon name="BellIcon" size={16} style={{ color: '#C8A99A' }} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-secondary" />
          </button>
          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-2xl py-2 z-50 animate-fade-in"
              style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <div className="px-4 py-2 flex items-center justify-between border-b" style={{ borderColor: 'var(--admin-border)' }}>
                <span className="text-sm font-semibold" style={{ color: '#F5EDE0' }}>Notifications</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(212,160,23,0.15)', color: '#D4A017' }}>5 new</span>
              </div>
              {[
                { id: 'notif-001', icon: '🛒', text: 'New order #FF-2026-0704 from Roberto Lim', time: '10 mins ago', unread: true },
                { id: 'notif-002', icon: '💳', text: 'Payment proof uploaded for order #FF-2026-0702', time: '25 mins ago', unread: true },
                { id: 'notif-003', icon: '⚠️', text: 'Shrimp stock is OUT — reorder immediately', time: '1 hr ago', unread: true },
                { id: 'notif-004', icon: '⚠️', text: 'Pork Belly stock critically low (8 kg left)', time: '2 hrs ago', unread: false },
                { id: 'notif-005', icon: '✅', text: 'Order #FF-2026-0701 marked as Confirmed', time: '3 hrs ago', unread: false },
              ]?.map(n => (
                <div
                  key={n?.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer"
                  style={{ background: n?.unread ? 'rgba(212,160,23,0.04)' : 'transparent' }}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{n?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug" style={{ color: n?.unread ? '#F5EDE0' : 'var(--admin-muted)' }}>
                      {n?.text}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>{n?.time}</p>
                  </div>
                  {n?.unread && <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0 mt-1.5" />}
                </div>
              ))}
              <div className="px-4 pt-2 border-t" style={{ borderColor: 'var(--admin-border)' }}>
                <button className="w-full text-center text-xs font-semibold py-2 rounded-lg transition-colors" style={{ color: '#D4A017' }}>
                  View all notifications
                </button>
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