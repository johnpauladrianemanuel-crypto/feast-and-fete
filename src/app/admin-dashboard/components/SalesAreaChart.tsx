'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DailySalesData } from '@/lib/supabase/services';

interface Props {
  data: DailySalesData[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: '#2E1A12',
        border: '1px solid #4A2E20',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <p className="text-xs font-semibold mb-1" style={{ color: '#C8A99A' }}>{label}</p>
      <p className="font-display text-base font-bold tabular-nums" style={{ color: '#D4A017' }}>
        ₱{payload[0]?.value?.toLocaleString()}
      </p>
    </div>
  );
}

export default function SalesAreaChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4A017" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#D4A017" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,46,32,0.6)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#8A6A58', fontSize: 10, fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fill: '#8A6A58', fontSize: 10, fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#D4A017"
          strokeWidth={2.5}
          fill="url(#salesGradient)"
          dot={false}
          activeDot={{ r: 5, fill: '#D4A017', stroke: '#2E1A12', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}