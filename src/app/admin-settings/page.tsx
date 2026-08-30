'use client';
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Icon from '@/components/ui/AppIcon';

interface AlertSetting {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
}

interface DeliveryMethod {
  id: 'in_app' | 'email' | 'both';
  label: string;
  description: string;
  icon: string;
}

interface QuietHours {
  enabled: boolean;
  from: string;
  to: string;
  days: number[];
}

const DELIVERY_METHODS: DeliveryMethod[] = [
  { id: 'in_app', label: 'In-App Only', description: 'Receive alerts inside the admin panel', icon: 'BellIcon' },
  { id: 'email', label: 'Email Only', description: 'Receive alerts via email', icon: 'EnvelopeIcon' },
  { id: 'both', label: 'Both', description: 'In-app + email notifications', icon: 'BoltIcon' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_ALERTS: AlertSetting[] = [
  {
    id: 'low_stock',
    label: 'Low Stock Alerts',
    description: 'Notify when inventory items fall below threshold',
    icon: 'ArchiveBoxIcon',
    color: '#f97316',
    enabled: true,
  },
  {
    id: 'pending_orders',
    label: 'Pending Orders',
    description: 'Notify when new orders are placed and awaiting confirmation',
    icon: 'ClipboardDocumentListIcon',
    color: '#3b82f6',
    enabled: true,
  },
  {
    id: 'reviews',
    label: 'New Reviews',
    description: 'Notify when customers leave ratings or reviews',
    icon: 'StarIcon',
    color: '#D4A017',
    enabled: false,
  },
  {
    id: 'order_cancelled',
    label: 'Order Cancellations',
    description: 'Notify when a customer cancels an order',
    icon: 'XCircleIcon',
    color: '#ef4444',
    enabled: true,
  },
  {
    id: 'order_completed',
    label: 'Order Completions',
    description: 'Notify when an order is marked as completed',
    icon: 'CheckCircleIcon',
    color: '#22c55e',
    enabled: false,
  },
];

function Toggle({ checked, onChange, color = '#D4A017' }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        background: checked ? color : 'var(--muted)',
        boxShadow: checked ? `0 0 8px ${color}60` : undefined,
      }}
    >
      <span
        className="inline-block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300"
        style={{ transform: checked ? 'translateX(26px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const [alerts, setAlerts] = useState<AlertSetting[]>(DEFAULT_ALERTS);
  const [deliveryMethod, setDeliveryMethod] = useState<'in_app' | 'email' | 'both'>('both');
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    from: '22:00',
    to: '08:00',
    days: [0, 6],
  });
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_notification_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.alerts) setAlerts(parsed.alerts);
        if (parsed.deliveryMethod) setDeliveryMethod(parsed.deliveryMethod);
        if (parsed.quietHours) setQuietHours(parsed.quietHours);
      }
    } catch { /* ignore */ }
  }, []);

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const toggleQuietDay = (day: number) => {
    setQuietHours(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('admin_notification_settings', JSON.stringify({ alerts, deliveryMethod, quietHours }));
    } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const enabledCount = alerts.filter(a => a.enabled).length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between"
          style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
              <Icon name="BellAlertIcon" size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-secondary">Notification Settings</h1>
              <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                {enabledCount} of {alerts.length} alerts active
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 relative overflow-hidden"
            style={{
              background: saved ? '#22c55e' : 'linear-gradient(135deg, #D4A017, #f59e0b)',
              color: '#1A0F0A',
              boxShadow: saved ? '0 0 16px #22c55e60' : '0 0 12px rgba(212,160,23,0.4)',
            }}
          >
            {saved ? (
              <>
                <Icon name="CheckIcon" size={16} />
                Saved!
              </>
            ) : (
              <>
                <Icon name="CloudArrowUpIcon" size={16} />
                Save Settings
              </>
            )}
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* Alert Types */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: 'var(--admin-surface)',
              borderColor: 'var(--admin-border)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--admin-border)' }}>
              <Icon name="BellIcon" size={18} className="text-secondary" />
              <div>
                <h2 className="font-display text-sm font-bold text-secondary">Alert Types</h2>
                <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Choose which events trigger notifications</p>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
              {alerts.map((alert, idx) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 px-5 py-4 transition-all duration-200 cursor-pointer group"
                  style={{
                    background: activeSection === alert.id ? `${alert.color}08` : 'transparent',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(-12px)',
                    transition: `opacity 0.4s ease ${0.05 + idx * 0.07}s, transform 0.4s ease ${0.05 + idx * 0.07}s, background 0.2s ease`,
                  }}
                  onMouseEnter={() => setActiveSection(alert.id)}
                  onMouseLeave={() => setActiveSection(null)}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      background: alert.enabled ? `${alert.color}20` : 'var(--admin-border)',
                      border: `1.5px solid ${alert.enabled ? alert.color + '40' : 'transparent'}`,
                    }}
                  >
                    <Icon
                      name={alert.icon as Parameters<typeof Icon>[0]['name']}
                      size={18}
                      style={{ color: alert.enabled ? alert.color : 'var(--admin-muted)' }}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold transition-colors"
                      style={{ color: alert.enabled ? 'var(--admin-text, #E8D5C4)' : 'var(--admin-muted)' }}
                    >
                      {alert.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                      {alert.description}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium mr-3 hidden sm:inline-flex items-center gap-1 transition-all duration-300"
                    style={{
                      background: alert.enabled ? `${alert.color}20` : 'var(--admin-border)',
                      color: alert.enabled ? alert.color : 'var(--admin-muted)',
                    }}
                  >
                    {alert.enabled && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: alert.color }} />}
                    {alert.enabled ? 'Active' : 'Off'}
                  </span>

                  {/* Toggle */}
                  <Toggle checked={alert.enabled} onChange={() => toggleAlert(alert.id)} color={alert.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Method */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: 'var(--admin-surface)',
              borderColor: 'var(--admin-border)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
            }}
          >
            <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--admin-border)' }}>
              <Icon name="PaperAirplaneIcon" size={18} className="text-secondary" />
              <div>
                <h2 className="font-display text-sm font-bold text-secondary">Delivery Method</h2>
                <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>How you receive notifications</p>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DELIVERY_METHODS.map((method, idx) => {
                const isSelected = deliveryMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setDeliveryMethod(method.id)}
                    className="relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 text-center group"
                    style={{
                      borderColor: isSelected ? '#D4A017' : 'var(--admin-border)',
                      background: isSelected ? 'rgba(212,160,23,0.08)' : 'transparent',
                      boxShadow: isSelected ? '0 0 16px rgba(212,160,23,0.2)' : undefined,
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
                      transition: `opacity 0.4s ease ${0.2 + idx * 0.08}s, transform 0.4s ease ${0.2 + idx * 0.08}s, border-color 0.2s, background 0.2s, box-shadow 0.2s`,
                    }}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full gradient-brand flex items-center justify-center">
                        <Icon name="CheckIcon" size={10} className="text-primary-foreground" />
                      </span>
                    )}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        background: isSelected ? 'rgba(212,160,23,0.2)' : 'var(--admin-border)',
                      }}
                    >
                      <Icon
                        name={method.icon as Parameters<typeof Icon>[0]['name']}
                        size={20}
                        style={{ color: isSelected ? '#D4A017' : 'var(--admin-muted)' }}
                      />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: isSelected ? '#D4A017' : 'var(--admin-muted)' }}>
                      {method.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{method.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiet Hours */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: 'var(--admin-surface)',
              borderColor: 'var(--admin-border)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s',
            }}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--admin-border)' }}>
              <div className="flex items-center gap-3">
                <Icon name="MoonIcon" size={18} className="text-secondary" />
                <div>
                  <h2 className="font-display text-sm font-bold text-secondary">Quiet Hours</h2>
                  <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Pause notifications during specific times</p>
                </div>
              </div>
              <Toggle
                checked={quietHours.enabled}
                onChange={(v) => setQuietHours(prev => ({ ...prev, enabled: v }))}
              />
            </div>

            <div
              className="overflow-hidden transition-all duration-500"
              style={{
                maxHeight: quietHours.enabled ? '400px' : '0px',
                opacity: quietHours.enabled ? 1 : 0,
              }}
            >
              <div className="p-5 space-y-5">
                {/* Time range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--admin-muted)' }}>
                      From
                    </label>
                    <div className="relative">
                      <Icon name="ClockIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-muted)' }} />
                      <input
                        type="time"
                        value={quietHours.from}
                        onChange={(e) => setQuietHours(prev => ({ ...prev, from: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                        style={{
                          background: 'var(--admin-bg)',
                          borderColor: 'var(--admin-border)',
                          color: 'var(--admin-text, #E8D5C4)',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--admin-muted)' }}>
                      To
                    </label>
                    <div className="relative">
                      <Icon name="ClockIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-muted)' }} />
                      <input
                        type="time"
                        value={quietHours.to}
                        onChange={(e) => setQuietHours(prev => ({ ...prev, to: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                        style={{
                          background: 'var(--admin-bg)',
                          borderColor: 'var(--admin-border)',
                          color: 'var(--admin-text, #E8D5C4)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Days */}
                <div>
                  <label className="block text-xs font-semibold mb-3" style={{ color: 'var(--admin-muted)' }}>
                    Apply on days
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {DAY_LABELS.map((day, idx) => {
                      const isActive = quietHours.days.includes(idx);
                      return (
                        <button
                          key={day}
                          onClick={() => toggleQuietDay(idx)}
                          className="w-10 h-10 rounded-xl text-xs font-bold transition-all duration-200"
                          style={{
                            background: isActive ? 'rgba(212,160,23,0.2)' : 'var(--admin-border)',
                            color: isActive ? '#D4A017' : 'var(--admin-muted)',
                            border: `1.5px solid ${isActive ? '#D4A01760' : 'transparent'}`,
                            boxShadow: isActive ? '0 0 8px rgba(212,160,23,0.2)' : undefined,
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview */}
                <div
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}
                >
                  <Icon name="InformationCircleIcon" size={16} style={{ color: '#D4A017' }} className="flex-shrink-0" />
                  <p className="text-xs" style={{ color: '#D4A017' }}>
                    Notifications paused from <strong>{quietHours.from}</strong> to <strong>{quietHours.to}</strong>
                    {quietHours.days.length > 0 && (
                      <> on <strong>{quietHours.days.map(d => DAY_LABELS[d]).join(', ')}</strong></>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {!quietHours.enabled && (
              <div className="px-5 py-4 flex items-center gap-2" style={{ color: 'var(--admin-muted)' }}>
                <Icon name="SunIcon" size={15} />
                <p className="text-xs">All notifications are active 24/7</p>
              </div>
            )}
          </div>

          {/* Summary card */}
          <div
            className="rounded-2xl border p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(212,160,23,0.08), rgba(212,160,23,0.03))',
              borderColor: 'rgba(212,160,23,0.25)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.4s ease 0.4s, transform 0.4s ease 0.4s',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Icon name="ChartBarIcon" size={16} style={{ color: '#D4A017' }} />
              <h3 className="text-sm font-bold text-secondary">Settings Summary</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,160,23,0.1)' }}>
                <p className="text-xl font-bold text-secondary">{enabledCount}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>Active Alerts</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,160,23,0.1)' }}>
                <p className="text-sm font-bold text-secondary capitalize">{deliveryMethod.replace('_', '-')}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>Delivery</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,160,23,0.1)' }}>
                <p className="text-sm font-bold text-secondary">{quietHours.enabled ? `${quietHours.from}–${quietHours.to}` : 'Off'}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>Quiet Hours</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}