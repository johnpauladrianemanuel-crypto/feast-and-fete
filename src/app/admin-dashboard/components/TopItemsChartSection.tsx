'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchTopItems } from '@/lib/supabase/services';

const TopItemsBarChart = dynamic(() => import('./TopItemsBarChart'), { ssr: false });

export default function TopItemsChartSection() {
  const [topItems, setTopItems] = useState<{ name: string; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopItems()
      .then(setTopItems)
      .catch(() => setTopItems([]))
      .finally(() => setLoading(false));
  }, []);

  const topItem = topItems[0];

  return (
    <div
      className="rounded-2xl p-5 admin-card-3d h-full"
      style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)' }}
    >
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#F5EDE0', letterSpacing: '0.06em' }}>
          Top Selling Items
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--admin-muted)' }}>
          {loading ? 'Loading…' : topItem
            ? <>By total orders all-time · Top: <span style={{ color: '#D4A017' }}>{topItem.name}</span></>
            : 'No order data yet'}
        </p>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-6 rounded" style={{ background: 'var(--admin-border)', width: `${80 - i * 10}%` }} />)}
        </div>
      ) : (
        <TopItemsBarChart data={topItems} />
      )}
    </div>
  );
}