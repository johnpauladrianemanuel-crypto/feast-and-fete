'use client';
import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { fetchDashboardKPIs, fetchInventoryItems, DashboardKPIs } from '@/lib/supabase/services';

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  trend?: { value: string; positive: boolean };
  variant: 'default' | 'warning' | 'error' | 'success';
  colSpan?: string;
}

function KPICard({ title, value, subtitle, icon, trend, variant, colSpan = '' }: KPICardProps) {
  const variantStyles = {
    default: {
      card: 'var(--admin-card)',
      icon: 'rgba(212,160,23,0.15)',
      iconColor: '#D4A017',
      valueColor: '#F5EDE0',
      trendBg: 'rgba(45,122,79,0.12)',
      trendColor: '#2D7A4F',
    },
    warning: {
      card: 'rgba(224,123,0,0.06)',
      icon: 'rgba(224,123,0,0.15)',
      iconColor: '#E07B00',
      valueColor: '#E07B00',
      trendBg: 'rgba(224,123,0,0.12)',
      trendColor: '#E07B00',
    },
    error: {
      card: 'rgba(192,57,43,0.08)',
      icon: 'rgba(192,57,43,0.15)',
      iconColor: '#C0392B',
      valueColor: '#C0392B',
      trendBg: 'rgba(192,57,43,0.12)',
      trendColor: '#C0392B',
    },
    success: {
      card: 'rgba(45,122,79,0.06)',
      icon: 'rgba(45,122,79,0.15)',
      iconColor: '#2D7A4F',
      valueColor: '#3DA866',
      trendBg: 'rgba(45,122,79,0.12)',
      trendColor: '#2D7A4F',
    },
  };

  const s = variantStyles[variant];

  return (
    <div
      className={`rounded-2xl p-5 admin-card-3d flex flex-col gap-4 ${colSpan}`}
      style={{ background: s.card, border: '1px solid var(--admin-border)' }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: s.icon }}
        >
          <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={20} style={{ color: s.iconColor }} />
        </div>
        {trend && (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: s.trendBg, color: s.trendColor }}
          >
            <Icon name={trend.positive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'} size={12} style={{ color: s.trendColor }} />
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-muted)', letterSpacing: '0.06em' }}>
          {title}
        </p>
        <p className="font-display text-3xl font-bold mt-1 tabular-nums" style={{ color: s.valueColor }}>
          {value}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--admin-muted)' }}>{subtitle}</p>
      </div>
    </div>
  );
}

export default function KPIBentoGrid() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [kpiData, inventoryItems] = await Promise.all([
          fetchDashboardKPIs(),
          fetchInventoryItems(),
        ]);
        setKpis(kpiData);
        setOutOfStockCount(inventoryItems.filter(i => i.status === 'Out of Stock').length);
      } catch {
        // use zeros on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl h-36" style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)' }} />
        ))}
      </div>
    );
  }

  const todayRevenue = kpis?.todayRevenue ?? 0;
  const todayOrderCount = kpis?.todayOrderCount ?? 0;
  const todayDeliveryCount = kpis?.todayDeliveryCount ?? 0;
  const todayPickupCount = kpis?.todayPickupCount ?? 0;
  const pendingOrderCount = kpis?.pendingOrderCount ?? 0;
  const lowStockCount = kpis?.lowStockCount ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      <KPICard
        title="Revenue Today"
        value={`₱${todayRevenue.toLocaleString()}`}
        subtitle={`From ${kpis?.todayOrderCount ?? 0} orders today`}
        icon="BanknotesIcon"
        trend={{ value: 'Live data', positive: true }}
        variant="success"
      />
      <KPICard
        title="Orders Today"
        value={String(todayOrderCount)}
        subtitle={`${todayDeliveryCount} delivery · ${todayPickupCount} pickup`}
        icon="ClipboardDocumentListIcon"
        variant="default"
      />
      <KPICard
        title="Pending Orders"
        value={String(pendingOrderCount)}
        subtitle="Awaiting payment verification & confirmation"
        icon="ClockIcon"
        trend={{ value: 'Needs review', positive: false }}
        variant="warning"
      />
      <KPICard
        title="Low Stock Alerts"
        value={String(lowStockCount)}
        subtitle={`${outOfStockCount} out of stock · ${lowStockCount - outOfStockCount} running low`}
        icon="ExclamationTriangleIcon"
        trend={{ value: 'Action needed', positive: false }}
        variant="error"
      />
    </div>
  );
}