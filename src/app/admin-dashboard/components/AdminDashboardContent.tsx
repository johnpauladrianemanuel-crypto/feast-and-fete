'use client';
import React, { useEffect, useState, useCallback } from 'react';
import AdminTopbar from './AdminTopbar';
import LowStockBanner from './LowStockBanner';
import KPIBentoGrid from './KPIBentoGrid';
import SalesChartSection from './SalesChartSection';
import TopItemsChartSection from './TopItemsChartSection';
import RecentOrdersTable from './RecentOrdersTable';
import QuickActions from './QuickActions';
import { fetchInventoryItems, InventoryItem } from '@/lib/supabase/services';

export default function AdminDashboardContent() {
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [criticalItems, setCriticalItems] = useState<InventoryItem[]>([]);

  const loadInventory = useCallback(async () => {
    try {
      const items = await fetchInventoryItems();
      setCriticalItems(items.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock'));
    } catch {
      // silently fail — banner is non-critical
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return (
    <div className="min-h-full">
      <AdminTopbar />
      <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6 max-w-screen-2xl mx-auto">
        {/* Low stock alert banner */}
        {criticalItems.length > 0 && !dismissedBanner && (
          <LowStockBanner items={criticalItems} onDismiss={() => setDismissedBanner(true)} />
        )}

        {/* Page heading */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>
              Good morning, Admin 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
              Here is what needs your attention today.
            </p>
          </div>
          <QuickActions />
        </div>

        {/* KPI Cards */}
        <KPIBentoGrid />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-5">
          <div className="lg:col-span-3 xl:col-span-3 2xl:col-span-3">
            <SalesChartSection />
          </div>
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2">
            <TopItemsChartSection />
          </div>
        </div>

        {/* Recent Orders */}
        <RecentOrdersTable />
      </div>
    </div>
  );
}