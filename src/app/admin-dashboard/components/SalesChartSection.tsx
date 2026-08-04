'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchSalesData, DailySalesData } from '@/lib/supabase/services';
import Icon from '@/components/ui/AppIcon';

const SalesAreaChart = dynamic(() => import('./SalesAreaChart'), { ssr: false });

export default function SalesChartSection() {
  const [salesData, setSalesData] = useState<DailySalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData(30)
      .then(setSalesData)
      .catch(() => setSalesData([]))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);
  const avgDaily = salesData.length > 0 ? Math.round(totalRevenue / salesData.length) : 0;

  return (
    <div
      className="rounded-2xl p-5 admin-card-3d h-full"
      style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#F5EDE0', letterSpacing: '0.06em' }}>
            Sales — Last 30 Days
          </h2>
          {loading ? (
            <div className="flex gap-4 mt-2 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-10 w-20 rounded-lg" style={{ background: 'var(--admin-border)' }} />)}
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-2">
              <div>
                <p className="font-display text-2xl font-bold tabular-nums" style={{ color: '#D4A017' }}>
                  ₱{totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Total revenue</p>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--admin-border)' }} />
              <div>
                <p className="font-display text-xl font-bold tabular-nums" style={{ color: '#F5EDE0' }}>{totalOrders}</p>
                <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Total orders</p>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--admin-border)' }} />
              <div>
                <p className="font-display text-xl font-bold tabular-nums" style={{ color: '#F5EDE0' }}>₱{avgDaily.toLocaleString()}</p>
                <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Avg/day</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(45,122,79,0.12)', color: '#3DA866' }}>
          <Icon name="ArrowTrendingUpIcon" size={12} style={{ color: '#3DA866' }} />
          Live data
        </div>
      </div>
      <SalesAreaChart data={salesData} />
    </div>
  );
}