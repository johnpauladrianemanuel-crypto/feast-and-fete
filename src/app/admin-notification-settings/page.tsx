'use client';
import React, { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import Icon from '@/components/ui/AppIcon';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AlertSetting {
  id: string;
  label: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  enabled: boolean;
}

interface DeliveryMethod {
  id: 'in_app' | 'email';
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface QuietHours {
  enabled: boolean;
  from: string;
  to: string;
  days: string[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center flex-shrink-0 transition-colors duration-200 focus:outline-none"
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? '#D4A017' : 'rgba(255,255,255,0.1)',
        border: `1px solid ${checked ? '#D4A017' : 'rgba(255,255,255,0.15)'}`,
      }}
    >
      <span
        className="inline-block rounded-full bg-white shadow transition-transform duration-200"
        style={{
          width: 18,
          height: 18,
          transform: checked ? 'translateX(22px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SettingsCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,160,23,0.12)' }}>
          <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={16} style={{ color: '#D4A017' }} />
        </div>
        <h2 className="font-display text-base font-bold" style={{ color: '#F5EDE0' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Save Toast ────────────────────────────────────────────────────────────────
function SaveToast({ visible }: { visible: boolean }) {
  return (
    <div
      className="fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl transition-all duration-300 z-50"
      style={{
        background: '#1A3A1A',
        border: '1px solid #22C55E40',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        pointerEvents: 'none',
      }}
    >
      <Icon name="CheckCircleIcon" size={18} style={{ color: '#22C55E' }} />
      <span className="text-sm font-semibold" style={{ color: '#86EFAC' }}>Settings saved successfully</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminNotificationSettingsPage() {
  const [alerts, setAlerts] = useState<AlertSetting[]>([
    {
      id: 'low_stock',
      label: 'Low Stock Alerts',
      description: 'Get notified when inventory items fall below the minimum threshold.',
      icon: 'ArchiveBoxIcon',
      iconColor: '#EAB308',
      iconBg: 'rgba(234,179,8,0.12)',
      enabled: true,
    },
    {
      id: 'pending_orders',
      label: 'Pending Orders',
      description: 'Receive alerts when new orders are placed and awaiting confirmation.',
      icon: 'ClipboardDocumentListIcon',
      iconColor: '#60A5FA',
      iconBg: 'rgba(96,165,250,0.12)',
      enabled: true,
    },
    {
      id: 'new_reviews',
      label: 'New Reviews',
      description: 'Be notified when customers submit ratings or reviews for menu items.',
      icon: 'StarIcon',
      iconColor: '#F97316',
      iconBg: 'rgba(249,115,22,0.12)',
      enabled: false,
    },
    {
      id: 'payment_received',
      label: 'Payment Received',
      description: 'Alert when a payment is confirmed for an order.',
      icon: 'BanknotesIcon',
      iconColor: '#4ADE80',
      iconBg: 'rgba(74,222,128,0.12)',
      enabled: true,
    },
    {
      id: 'order_cancelled',
      label: 'Order Cancellations',
      description: 'Get notified when a customer cancels their order.',
      icon: 'XCircleIcon',
      iconColor: '#F87171',
      iconBg: 'rgba(248,113,113,0.12)',
      enabled: true,
    },
  ]);

  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([
    {
      id: 'in_app',
      label: 'In-App Notifications',
      description: 'Show alerts in the admin notification center.',
      icon: 'BellIcon',
      enabled: true,
    },
    {
      id: 'email',
      label: 'Email Notifications',
      description: 'Send alerts to the admin email address.',
      icon: 'EnvelopeIcon',
      enabled: false,
    },
  ]);

  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    from: '22:00',
    to: '08:00',
    days: ['Sat', 'Sun'],
  });

  const [showToast, setShowToast] = useState(false);

  const toggleAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const toggleDelivery = (id: 'in_app' | 'email') => {
    setDeliveryMethods((prev) => prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d)));
  };

  const toggleDay = (day: string) => {
    setQuietHours((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  };

  const handleSave = () => {
    // In a real app, persist to Supabase or localStorage
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const enabledAlertsCount = alerts.filter((a) => a.enabled).length;
  const enabledDeliveryCount = deliveryMethods.filter((d) => d.enabled).length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminTopbar />
        <div className="px-6 lg:px-8 py-6 max-w-3xl mx-auto space-y-6">

          {/* Page Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>
                Notification Settings
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--admin-muted)' }}>
                Configure which alerts you receive, how they're delivered, and when to stay quiet.
              </p>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#D4A017', color: '#1A0F0A' }}
            >
              <Icon name="CheckIcon" size={16} />
              Save Settings
            </button>
          </div>

          {/* ── Alert Types ── */}
          <SettingsCard title="Alert Types" icon="BellAlertIcon">
            <div className="space-y-1">
              {alerts.map((alert, idx) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 py-3.5 transition-colors rounded-xl px-2 -mx-2"
                  style={{
                    borderBottom: idx < alerts.length - 1 ? '1px solid var(--admin-border)' : 'none',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: alert.iconBg }}
                  >
                    <Icon
                      name={alert.icon as Parameters<typeof Icon>[0]['name']}
                      size={18}
                      style={{ color: alert.iconColor }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#F5EDE0' }}>{alert.label}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--admin-muted)' }}>
                      {alert.description}
                    </p>
                  </div>
                  <Toggle
                    checked={alert.enabled}
                    onChange={() => toggleAlert(alert.id)}
                    label={`Toggle ${alert.label}`}
                  />
                </div>
              ))}
            </div>
            <div
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'rgba(212,160,23,0.08)', color: 'var(--admin-muted)' }}
            >
              <Icon name="InformationCircleIcon" size={14} style={{ color: '#D4A017' }} />
              <span>{enabledAlertsCount} of {alerts.length} alert types enabled</span>
            </div>
          </SettingsCard>

          {/* ── Delivery Method ── */}
          <SettingsCard title="Delivery Method" icon="PaperAirplaneIcon">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deliveryMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => toggleDelivery(method.id)}
                  className="flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                  style={{
                    background: method.enabled ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${method.enabled ? 'rgba(212,160,23,0.4)' : 'var(--admin-border)'}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: method.enabled ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <Icon
                      name={method.icon as Parameters<typeof Icon>[0]['name']}
                      size={18}
                      style={{ color: method.enabled ? '#D4A017' : 'var(--admin-muted)' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: method.enabled ? '#F5EDE0' : 'var(--admin-muted)' }}>
                        {method.label}
                      </p>
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: method.enabled ? '#D4A017' : 'var(--admin-muted)',
                          background: method.enabled ? '#D4A017' : 'transparent',
                        }}
                      >
                        {method.enabled && <Icon name="CheckIcon" size={10} style={{ color: '#1A0F0A' }} />}
                      </div>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--admin-muted)' }}>
                      {method.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {enabledDeliveryCount === 0 && (
              <div
                className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(248,113,113,0.08)', color: '#F87171' }}
              >
                <Icon name="ExclamationTriangleIcon" size={14} />
                <span>At least one delivery method should be enabled to receive alerts.</span>
              </div>
            )}
          </SettingsCard>

          {/* ── Quiet Hours ── */}
          <SettingsCard title="Quiet Hours" icon="MoonIcon">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F5EDE0' }}>Enable Quiet Hours</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                  Pause non-critical notifications during specified hours.
                </p>
              </div>
              <Toggle
                checked={quietHours.enabled}
                onChange={(v) => setQuietHours((prev) => ({ ...prev, enabled: v }))}
                label="Toggle quiet hours"
              />
            </div>

            <div
              className="space-y-5 transition-all duration-300"
              style={{ opacity: quietHours.enabled ? 1 : 0.35, pointerEvents: quietHours.enabled ? 'auto' : 'none' }}
            >
              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>
                    From
                  </label>
                  <div className="relative">
                    <Icon
                      name="ClockIcon"
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--admin-muted)' }}
                    />
                    <input
                      type="time"
                      value={quietHours.from}
                      onChange={(e) => setQuietHours((prev) => ({ ...prev, from: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--admin-border)',
                        color: '#F5EDE0',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>
                    To
                  </label>
                  <div className="relative">
                    <Icon
                      name="ClockIcon"
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--admin-muted)' }}
                    />
                    <input
                      type="time"
                      value={quietHours.to}
                      onChange={(e) => setQuietHours((prev) => ({ ...prev, to: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--admin-border)',
                        color: '#F5EDE0',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>
                  Active Days
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day) => {
                    const isSelected = quietHours.days.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: isSelected ? '#D4A017' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#1A0F0A' : 'var(--admin-muted)',
                          border: `1px solid ${isSelected ? '#D4A017' : 'var(--admin-border)'}`,
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              {quietHours.days.length > 0 && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs"
                  style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}
                >
                  <Icon name="MoonIcon" size={14} style={{ color: '#A78BFA', marginTop: 1 }} />
                  <p style={{ color: '#C4B5FD' }}>
                    Notifications will be silenced from{' '}
                    <strong>{quietHours.from}</strong> to <strong>{quietHours.to}</strong> on{' '}
                    <strong>{quietHours.days.join(', ')}</strong>.
                  </p>
                </div>
              )}
            </div>
          </SettingsCard>

          {/* Save Button (bottom) */}
          <div className="flex justify-end pb-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#D4A017', color: '#1A0F0A' }}
            >
              <Icon name="CheckIcon" size={16} />
              Save All Settings
            </button>
          </div>
        </div>
      </main>

      <SaveToast visible={showToast} />
    </div>
  );
}
