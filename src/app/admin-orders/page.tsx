'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import OrderDetailModal, { Order, OrderStatus } from './components/OrderDetailModal';

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  Pending: { bg: 'rgba(234,179,8,0.15)', text: '#EAB308' },
  Confirmed: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' },
  Preparing: { bg: 'rgba(249,115,22,0.15)', text: '#FB923C' },
  Ready: { bg: 'rgba(34,197,94,0.15)', text: '#4ADE80' },
  Shipped: { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA' },
  Completed: { bg: 'rgba(100,116,139,0.15)', text: '#94A3B8' },
  Cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#F87171' },
};

const ALL_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready',
  'Shipped',
  'Completed',
  'Cancelled',
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  Pending: 'Confirmed',
  Confirmed: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Shipped',
  Shipped: 'Completed',
};

const PAYMENT_LABELS: Record<string, string> = {
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError('Failed to load orders. Please try again.');
      } else {
        setOrders((data as Order[]) || []);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('admin_orders_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id
                ? { ...o, ...(payload.new as Partial<Order>), order_items: o.order_items }
                : o
            )
          );
          setSelectedOrder((prev) =>
            prev && prev.id === payload.new.id
              ? { ...prev, ...(payload.new as Partial<Order>), order_items: prev.order_items }
              : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
    setUpdatingId(orderId);
    const previousOrders = [...orders];

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              notes: reason ? `Cancelled: ${reason}` : o.notes,
            }
          : o
      )
    );

    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              notes: reason ? `Cancelled: ${reason}` : prev.notes,
            }
          : null
      );
    }

    try {
      const updatePayload: { status: OrderStatus; updated_at: string; notes?: string } = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (reason) {
        updatePayload.notes = `Cancelled: ${reason}`;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order status:', updateError.message);
        setOrders(previousOrders);
        if (selectedOrder) {
          const original = previousOrders.find((o) => o.id === selectedOrder.id);
          if (original) setSelectedOrder(original);
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
      setOrders(previousOrders);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime())
      ? 'N/A'
      : parsed.toLocaleDateString('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminTopbar />
        <div className="px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>
                Orders
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                {loading ? 'Loading...' : `${orders.length} total order${orders.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                color: '#F5EDE0',
              }}
            >
              <Icon name="ArrowPathIcon" size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#F87171',
              }}
            >
              <Icon name="ExclamationCircleIcon" size={16} />
              {error}
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('All')}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer"
              style={{
                background: filterStatus === 'All' ? '#D4A017' : 'var(--admin-surface)',
                color: filterStatus === 'All' ? '#1A0F0A' : 'var(--admin-muted)',
                border: '1px solid var(--admin-border)',
              }}
            >
              All ({orders.length})
            </button>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: filterStatus === s ? STATUS_COLORS[s].bg : 'var(--admin-surface)',
                  color: STATUS_COLORS[s].text,
                  border: `1px solid ${filterStatus === s ? STATUS_COLORS[s].text : 'var(--admin-border)'}`,
                }}
              >
                {s} ({counts[s]})
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-sm">
            <Icon
              name="MagnifyingGlassIcon"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--admin-muted)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order # or customer..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                color: '#F5EDE0',
              }}
            />
          </div>

          {/* Skeleton loading */}
          {loading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-xl" style={{ background: 'var(--admin-surface)' }} />
              ))}
            </div>
          )}

          {/* Table */}
          {!loading && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    {['Order #', 'Customer', 'Items', 'Total', 'Method', 'Payment', 'Status', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{ color: 'var(--admin-muted)' }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-white/5"
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none',
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: '#D4A017' }}>
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: '#F5EDE0' }}>
                          {order.customer_name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>
                          {order.event_date ? formatDate(order.event_date) : formatDate(order.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--admin-muted)' }}>
                        {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: '#F5EDE0' }}>
                        ₱{Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 capitalize" style={{ color: 'var(--admin-muted)' }}>
                        {order.delivery_method}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--admin-muted)' }}>
                        {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium inline-block"
                          style={{
                            background: STATUS_COLORS[order.status]?.bg,
                            color: STATUS_COLORS[order.status]?.text,
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                            style={{
                              background: 'rgba(212,160,23,0.12)',
                              color: '#D4A017',
                              border: '1px solid rgba(212,160,23,0.3)',
                            }}
                          >
                            <Icon name="EyeIcon" size={13} />
                            Details
                          </button>

                          {NEXT_STATUS[order.status] && (
                            <button
                              onClick={() => updateStatus(order.id, NEXT_STATUS[order.status]!)}
                              disabled={updatingId === order.id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer"
                              style={{
                                background: 'rgba(59,130,246,0.15)',
                                color: '#60A5FA',
                                border: '1px solid rgba(59,130,246,0.3)',
                              }}
                            >
                              {updatingId === order.id ? 'Updating...' : `→ ${NEXT_STATUS[order.status]}`}
                            </button>
                          )}

                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                            className="px-2 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                            style={{
                              border: '1px solid var(--admin-border)',
                              color: 'var(--admin-muted)',
                              background: 'var(--admin-surface)',
                            }}
                          >
                            {ALL_STATUSES.map((status) => (
                              <option
                                key={status}
                                value={status}
                                style={{ background: '#1A0F0A', color: '#F5EDE0' }}
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm"
                        style={{ color: 'var(--admin-muted)' }}
                      >
                        {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={updateStatus}
          updatingId={updatingId}
        />
      )}
    </div>
  );
}