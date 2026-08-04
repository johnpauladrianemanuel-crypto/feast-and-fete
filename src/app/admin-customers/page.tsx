'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import { fetchCustomers, CustomerRow } from '@/lib/supabase/services';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface CustomerOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [sortBy, setSortBy] = useState<'totalSpent' | 'totalOrders' | 'joinDate'>('totalSpent');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const loadCustomerOrders = useCallback(async (customerId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, created_at')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .limit(5);
    setCustomerOrders((data as CustomerOrder[]) || []);
  }, []);

  const handleSelectCustomer = (customer: CustomerRow) => {
    setSelectedCustomer(customer);
    loadCustomerOrders(customer.id);
  };

  const filtered = customers
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'joinDate') return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      return b[sortBy] - a[sortBy];
    });

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrdersAll = customers.reduce((s, c) => s + c.totalOrders, 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminTopbar />
        <div className="px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>Customers</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
              {loading ? 'Loading…' : `${customers.length} registered customers`}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
              <Icon name="ExclamationCircleIcon" size={16} />
              {error}
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Customers', value: customers.length, color: '#F5EDE0' },
              { label: 'Total Orders', value: totalOrdersAll, color: '#60A5FA' },
              { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}`, color: '#D4A017' },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>{card.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: '#F5EDE0', width: 240 }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>Sort by:</span>
              {[
                { key: 'totalSpent' as const, label: 'Highest Spend' },
                { key: 'totalOrders' as const, label: 'Most Orders' },
                { key: 'joinDate' as const, label: 'Newest' },
              ].map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: sortBy === s.key ? '#D4A017' : 'var(--admin-surface)', color: sortBy === s.key ? '#1A0F0A' : 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 rounded-xl" style={{ background: 'var(--admin-surface)' }} />)}
            </div>
          ) : (
            <div className="flex gap-5">
              {/* Customer Table */}
              <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                      {['Customer', 'Contact', 'Orders', 'Total Spent', 'Member Since'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((customer, i) => (
                      <tr
                        key={customer.id}
                        className="cursor-pointer transition-colors hover:bg-white/5"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none', background: selectedCustomer?.id === customer.id ? 'rgba(212,160,23,0.06)' : 'transparent' }}
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 gradient-brand">
                              <span className="text-xs font-bold text-primary-foreground">{customer.name.charAt(0)}</span>
                            </div>
                            <span className="font-medium" style={{ color: '#F5EDE0' }}>{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{customer.email}</p>
                          <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{customer.phone}</p>
                        </td>
                        <td className="px-5 py-3.5 font-semibold" style={{ color: '#60A5FA' }}>{customer.totalOrders}</td>
                        <td className="px-5 py-3.5 font-semibold" style={{ color: '#D4A017' }}>₱{customer.totalSpent.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--admin-muted)' }}>{customer.joinDate}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>No customers found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Customer Detail */}
              {selectedCustomer && (
                <div className="w-72 flex-shrink-0 rounded-2xl p-5 space-y-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm" style={{ color: '#F5EDE0' }}>Customer Profile</h3>
                    <button onClick={() => setSelectedCustomer(null)} style={{ color: 'var(--admin-muted)' }}><Icon name="XMarkIcon" size={16} /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center gradient-brand">
                      <span className="text-lg font-bold text-primary-foreground">{selectedCustomer.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#F5EDE0' }}>{selectedCustomer.name}</p>
                      <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Since {selectedCustomer.joinDate}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
                    {[
                      { label: 'Email', value: selectedCustomer.email },
                      { label: 'Phone', value: selectedCustomer.phone || '—' },
                      { label: 'Address', value: selectedCustomer.address || '—' },
                    ].map(row => (
                      <div key={row.label}>
                        <p className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>{row.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#F5EDE0' }}>{row.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
                    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--admin-bg)' }}>
                      <p className="text-xl font-bold" style={{ color: '#60A5FA' }}>{selectedCustomer.totalOrders}</p>
                      <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Orders</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--admin-bg)' }}>
                      <p className="text-lg font-bold" style={{ color: '#D4A017' }}>₱{(selectedCustomer.totalSpent / 1000).toFixed(1)}k</p>
                      <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Spent</p>
                    </div>
                  </div>
                  {customerOrders.length > 0 && (
                    <div className="pt-2 space-y-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>Recent Orders</p>
                      {customerOrders.slice(0, 3).map(order => (
                        <div key={order.id} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background: 'var(--admin-bg)' }}>
                          <span className="font-mono" style={{ color: '#D4A017' }}>{order.order_number}</span>
                          <span style={{ color: '#F5EDE0' }}>₱{Number(order.total_amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
