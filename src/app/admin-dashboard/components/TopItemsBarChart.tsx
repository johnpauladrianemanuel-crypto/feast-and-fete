'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DataItem {
  name: string;
  orders: number;
}

interface Props {
  data: DataItem[];
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
        {payload[0]?.value} orders
      </p>
    </div>
  );
}

const BAR_COLORS = ['#D4A017', '#B8860B', '#C49A14', '#A87A0A', '#C09010', '#A07008', '#B88010', '#906000'];

export default function TopItemsBarChart({ data }: Props) {
  const shortNames = data.map(d => {
    const parts = d.name.split(' ');
    return parts.length > 2 ? parts.slice(0, 2).join(' ') : d.name;
  });

  const chartData = data.map((d, i) => ({ ...d, shortName: shortNames[i] }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,46,32,0.5)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#8A6A58', fontSize: 10, fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          tick={{ fill: '#C8A99A', fontSize: 10, fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(212,160,23,0.05)' }} />
        <Bar dataKey="orders" radius={[0, 6, 6, 0]} maxBarSize={18}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}