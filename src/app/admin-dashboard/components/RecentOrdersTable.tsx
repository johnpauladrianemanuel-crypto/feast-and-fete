'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
type PaymentStatus = 'Pending' | 'Verified' | 'Rejected';

interface OrderItem {
  id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: string;
  total_amount: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  order_items: OrderItem[];
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { label: string; cls: string; icon: string }> = {
    Pending: { label: 'Pending', cls: 'status-pending', icon: 'ClockIcon' },
    Confirmed: { label: 'Confirmed', cls: 'status-confirmed', icon: 'CheckCircleIcon' },
    Preparing: { label: 'Preparing', cls: 'status-preparing', icon: 'FireIcon' },
    Ready: { label: 'Ready', cls: 'status-ready', icon: 'BellIcon' },
    Completed: { label: 'Completed', cls: 'status-completed', icon: 'CheckBadgeIcon' },
    Cancelled: { label: 'Cancelled', cls: 'status-cancelled', icon: 'XCircleIcon' },
  };
  const c = config[status] ?? config['Pending'];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${c.cls}`}>
      <Icon name={c.icon as Parameters<typeof Icon>[0]['name']} size={11} />
      {c.label}
    </span>
  );
}

function PaymentBadge({ method }: { method: string }) {
  const label = method === 'gcash' ? 'GCash' : method === 'bank_transfer' ? 'Bank Transfer' : method === 'cash' ? 'Cash' : method;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold payment-pending">
      {label}
    </span>
  );
}

export default function RecentOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      setOrders((data as Order[]) || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('recent_orders_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...(payload.new as Partial<Order>) } : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchOrders]);

  const displayOrders = orders
    .filter(o => statusFilter === 'all' ? true : o.status === statusFilter)
    .slice(0, 8);

  const statusOptions = ['all', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  return (
    <div
      className="rounded-2xl admin-card-3d overflow-hidden"
      style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--admin-border)' }}>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#F5EDE0', letterSpacing: '0.06em' }}>
            Recent Orders
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>
            {loading ? 'Loading...' : `${displayOrders.length} orders shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
            {statusOptions.map(s => (
              <button
                key={`filter-${s}`}
                onClick={() => setStatusFilter(s)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  background: statusFilter === s ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.04)',
                  color: statusFilter === s ? '#D4A017' : 'var(--admin-muted)',
                  border: statusFilter === s ? '1px solid rgba(212,160,23,0.3)' : '1px solid var(--admin-border)',
                }}
              >
                {s === 'all' ? 'All Orders' : s}
              </button>
            ))}
          </div>
          <Link
            href="/admin-orders"
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#D4A017', background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}
          >
            View All
            <Icon name="ArrowRightIcon" size={12} style={{ color: '#D4A017' }} />
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
              {['Order #', 'Customer', 'Date & Time', 'Items', 'Total', 'Method', 'Payment', 'Status'].map(col => (
                <th
                  key={`th-${col}`}
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--admin-muted)', letterSpacing: '0.06em' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" style={{ borderColor: '#D4A017', borderTopColor: 'transparent' }} />
                    <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>Loading orders…</p>
                  </div>
                </td>
              </tr>
            ) : displayOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>No orders match this filter.</p>
                </td>
              </tr>
            ) : (
              displayOrders.map(order => (
                <tr
                  key={order.id}
                  onMouseEnter={() => setHoveredRow(order.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(74,46,32,0.4)',
                    background: hoveredRow === order.id ? 'rgba(212,160,23,0.03)' : 'transparent',
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold font-mono" style={{ color: '#D4A017' }}>{order.order_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 gradient-brand">
                        <span className="text-xs font-bold text-primary-foreground">
                          {order.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold truncate max-w-[110px]" style={{ color: '#F5EDE0' }}>{order.customer_name}</p>
                        <p className="text-xs truncate max-w-[110px]" style={{ color: 'var(--admin-muted)' }}>{order.customer_phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: '#C8A99A' }}>
                      {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                      {new Date(order.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: '#C8A99A' }}>
                      {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs truncate max-w-[120px]" style={{ color: 'var(--admin-muted)' }}>
                      {order.order_items?.[0]?.menu_item_name ?? '—'}
                      {(order.order_items?.length ?? 0) > 1 && ` +${(order.order_items?.length ?? 0) - 1} more`}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold tabular-nums font-display" style={{ color: '#D4A017' }}>
                      ₱{Number(order.total_amount).toLocaleString()}
                    </span>
                    <p className="text-xs capitalize" style={{ color: 'var(--admin-muted)' }}>{order.delivery_method}</p>
                  </td>
                  <td className="px-4 py-3">
                    <PaymentBadge method={order.payment_method} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium capitalize" style={{ color: '#C8A99A' }}>{order.payment_method?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--admin-border)' }}>
        <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>
          Showing {displayOrders.length} of {orders.length} total orders
        </p>
        <Link href="/admin-orders" className="text-xs font-semibold" style={{ color: '#D4A017' }}>
          View all orders →
        </Link>
      </div>
    </div>
  );
}