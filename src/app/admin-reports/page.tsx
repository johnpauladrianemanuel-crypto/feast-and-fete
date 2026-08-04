'use client';
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import { fetchSalesData, fetchTopItems, fetchExpenses, DailySalesData } from '@/lib/supabase/services';
import { createClient } from '@/lib/supabase/client';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PERIODS = ['Last 7 Days', 'Last 14 Days', 'Last 30 Days'] as const;
type Period = typeof PERIODS[number];
const PERIOD_DAYS: Record<Period, number> = { 'Last 7 Days': 7, 'Last 14 Days': 14, 'Last 30 Days': 30 };
const PIE_COLORS = ['#D4A017', '#60A5FA', '#FB923C', '#A78BFA', '#4ADE80', '#F87171'];

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<Period>('Last 30 Days');
  const [salesData, setSalesData] = useState<DailySalesData[]>([]);
  const [topItems, setTopItems] = useState<{ name: string; orders: number }[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<{ name: string; value: number; color: string }[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<{ name: string; orders: number }[]>([]);
  const [totalOrdersAll, setTotalOrdersAll] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const days = PERIOD_DAYS[period];
    setLoading(true);

    Promise.all([
      fetchSalesData(days),
      fetchTopItems(),
      fetchExpenses(),
    ]).then(async ([sales, items, expenses]) => {
      setSalesData(sales);
      setTopItems(items);

      const catMap: Record<string, number> = {};
      expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      setExpenseByCategory(
        Object.entries(catMap).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }))
      );

      // Payment method breakdown
      const supabase = createClient();
      const { data: orders } = await supabase.from('orders').select('payment_method, status');
      const pmMap: Record<string, number> = {};
      (orders || []).forEach((o: Record<string, unknown>) => {
        const pm = (o.payment_method as string) || 'unknown';
        pmMap[pm] = (pmMap[pm] || 0) + 1;
      });
      setPaymentMethodData(Object.entries(pmMap).map(([name, orders]) => ({
        name: name === 'gcash' ? 'GCash' : name === 'bank_transfer' ? 'Bank Transfer' : name === 'cash' ? 'Cash' : name === 'cash_on_delivery' ? 'Cash on Delivery' : name,
        orders,
      })));

      const total = (orders || []).length;
      const completed = (orders || []).filter((o: Record<string, unknown>) => o.status === 'Completed' || o.status === 'Ready').length;
      setTotalOrdersAll(total);
      setCompletedOrders(completed);
    }).catch(() => {
      // silently fail
    }).finally(() => setLoading(false));
  }, [period]);

  const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);
  const totalExpenses = expenseByCategory.reduce((s, e) => s + e.value, 0);
  const netProfit = totalRevenue - totalExpenses;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const completionRate = totalOrdersAll > 0 ? Math.round((completedOrders / totalOrdersAll) * 100) : 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminTopbar />
        <div className="px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>Reports</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>Business performance overview</p>
            </div>
            <div className="flex gap-2">
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{ background: period === p ? '#D4A017' : 'var(--admin-surface)', color: period === p ? '#1A0F0A' : 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 rounded-2xl" style={{ background: 'var(--admin-surface)' }} />)}
            </div>
          ) : (
            <>
              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}`, color: '#D4A017' },
                  { label: 'Total Orders', value: totalOrders, color: '#60A5FA' },
                  { label: 'Avg Order Value', value: `₱${avgOrderValue.toLocaleString()}`, color: '#4ADE80' },
                  { label: 'Total Expenses', value: `₱${totalExpenses.toLocaleString()}`, color: '#F87171' },
                  { label: 'Net Profit', value: `₱${netProfit.toLocaleString()}`, color: netProfit >= 0 ? '#4ADE80' : '#F87171' },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-2xl p-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>{kpi.label}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue Chart */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                <h3 className="font-semibold text-sm mb-4" style={{ color: '#F5EDE0' }}>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4A017" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#8B7355', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8B7355', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: '#2A1A10', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 12, color: '#F5EDE0' }} formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#D4A017" strokeWidth={2} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Top Items */}
                <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                  <h3 className="font-semibold text-sm mb-4" style={{ color: '#F5EDE0' }}>Top Selling Items</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topItems} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#8B7355', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#C8A99A', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                      <Tooltip contentStyle={{ background: '#2A1A10', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 12, color: '#F5EDE0' }} />
                      <Bar dataKey="orders" fill="#D4A017" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Expense Breakdown */}
                <div className="rounded-2xl p-5" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                  <h3 className="font-semibold text-sm mb-4" style={{ color: '#F5EDE0' }}>Expense Breakdown</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#2A1A10', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 12, color: '#F5EDE0' }} formatter={(v: number) => [`₱${v.toLocaleString()}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {expenseByCategory.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span style={{ color: 'var(--admin-muted)' }}>{d.name}</span>
                        </div>
                        <span style={{ color: '#F5EDE0' }}>₱{d.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Methods + Order Completion */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl p-5" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                  <h3 className="font-semibold text-sm mb-4" style={{ color: '#F5EDE0' }}>Orders by Payment Method</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={paymentMethodData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: '#8B7355', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#8B7355', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#2A1A10', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 12, color: '#F5EDE0' }} />
                      <Bar dataKey="orders" fill="#60A5FA" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                  <h3 className="font-semibold text-sm mb-4" style={{ color: '#F5EDE0' }}>Order Completion Rate</h3>
                  <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                      <p className="text-6xl font-bold" style={{ color: '#4ADE80' }}>{completionRate}%</p>
                      <p className="text-sm mt-2" style={{ color: 'var(--admin-muted)' }}>{completedOrders} of {totalOrdersAll} orders completed</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-full overflow-hidden h-3" style={{ background: 'var(--admin-bg)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${completionRate}%`, background: 'linear-gradient(90deg, #4ADE80, #22C55E)' }} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
