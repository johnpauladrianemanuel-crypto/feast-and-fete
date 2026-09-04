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
  
  // State para sa Modal Form ng Completed & Cancelled Orders
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveFilterStatus, setArchiveFilterStatus] = useState<'All' | 'Completed' | 'Cancelled'>('All');
  const [archiveSearch, setArchiveSearch] = useState('');

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

  // Active orders (Lahat maliban sa Completed at Cancelled)
  const activeOrders = orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled');

  const filteredActive = activeOrders.filter((o) => {
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Completed & Cancelled orders para sa Modal Form
  const archiveOrders = orders.filter((o) => o.status === 'Completed' || o.status === 'Cancelled');
  const filteredArchive = archiveOrders.filter((o) => {
    const matchStatus = archiveFilterStatus === 'All' || o.status === archiveFilterStatus;
    const matchSearch =
      o.order_number.toLowerCase().includes(archiveSearch.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(archiveSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeStatuses: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Shipped'];

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
                Active Orders
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                {loading ? 'Loading...' : `${activeOrders.length} active order${activeOrders.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Button para buksan ang Completed & Cancelled Form Modal */}
              <button
                onClick={() => setShowArchiveModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-md"
                style={{
                  background: 'rgba(212,160,23,0.15)',
                  border: '1px solid #D4A017',
                  color: '#D4A017',
                }}
              >
                <Icon name="ArchiveBoxIcon" size={16} />
                Completed & Cancelled ({archiveOrders.length})
              </button>

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
          </div>

          {/* Interactive Clickable Summary Cards (Active Only) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setFilterStatus('All')}
              className="p-4 rounded-2xl flex flex-col justify-between text-left transition-all cursor-pointer"
              style={{
                background: filterStatus === 'All' ? 'rgba(212,160,23,0.15)' : 'var(--admin-surface)',
                border: `1px solid ${filterStatus === 'All' ? '#D4A017' : 'var(--admin-border)'}`,
              }}
            >
              <span className="text-xs font-semibold" style={{ color: filterStatus === 'All' ? '#D4A017' : 'var(--admin-muted)' }}>
                All Active
              </span>
              <span className="text-2xl font-bold mt-2" style={{ color: filterStatus === 'All' ? '#D4A017' : '#F5EDE0' }}>
                {activeOrders.length}
              </span>
            </button>

            {activeStatuses.map((status) => {
              const isSelected = filterStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className="p-4 rounded-2xl flex flex-col justify-between text-left transition-all cursor-pointer"
                  style={{
                    background: isSelected ? STATUS_COLORS[status].bg : 'var(--admin-surface)',
                    border: `1px solid ${isSelected ? STATUS_COLORS[status].text : 'var(--admin-border)'}`,
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: isSelected ? STATUS_COLORS[status].text : 'var(--admin-muted)' }}>
                    {status}
                  </span>
                  <span className="text-2xl font-bold mt-2" style={{ color: STATUS_COLORS[status].text }}>
                    {counts[status]}
                  </span>
                </button>
              );
            })}
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
              placeholder="Search active orders..."
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
                  {filteredActive.map((order, i) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-white/5"
                      style={{
                        borderBottom: i < filteredActive.length - 1 ? '1px solid var(--admin-border)' : 'none',
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
                  {filteredActive.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm"
                        style={{ color: 'var(--admin-muted)' }}
                      >
                        {activeOrders.length === 0 ? 'No active orders right now.' : 'No active orders match your search/filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL FORM PARA SA COMPLETED & CANCELLED ORDERS */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div 
            className="rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border"
            style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
              <div>
                <h2 className="font-display text-xl font-bold" style={{ color: '#F5EDE0' }}>
                  Completed & Cancelled Orders Form
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                  Total archived: {archiveOrders.length} order(s)
                </p>
              </div>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="p-2 rounded-xl transition-colors cursor-pointer"
                style={{ color: 'var(--admin-muted)' }}
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Filter tabs & Search inside modal */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setArchiveFilterStatus('All')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    style={{
                      background: archiveFilterStatus === 'All' ? 'rgba(212,160,23,0.2)' : 'var(--admin-surface)',
                      border: `1px solid ${archiveFilterStatus === 'All' ? '#D4A017' : 'var(--admin-border)'}`,
                      color: archiveFilterStatus === 'All' ? '#D4A017' : 'var(--admin-muted)',
                    }}
                  >
                    All ({archiveOrders.length})
                  </button>
                  <button
                    onClick={() => setArchiveFilterStatus('Completed')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    style={{
                      background: archiveFilterStatus === 'Completed' ? STATUS_COLORS['Completed'].bg : 'var(--admin-surface)',
                      border: `1px solid ${archiveFilterStatus === 'Completed' ? STATUS_COLORS['Completed'].text : 'var(--admin-border)'}`,
                      color: STATUS_COLORS['Completed'].text,
                    }}
                  >
                    Completed ({counts['Completed']})
                  </button>
                  <button
                    onClick={() => setArchiveFilterStatus('Cancelled')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    style={{
                      background: archiveFilterStatus === 'Cancelled' ? STATUS_COLORS['Cancelled'].bg : 'var(--admin-surface)',
                      border: `1px solid ${archiveFilterStatus === 'Cancelled' ? STATUS_COLORS['Cancelled'].text : 'var(--admin-border)'}`,
                      color: STATUS_COLORS['Cancelled'].text,
                    }}
                  >
                    Cancelled ({counts['Cancelled']})
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Icon
                    name="MagnifyingGlassIcon"
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--admin-muted)' }}
                  />
                  <input
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder="Search order # or customer..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--admin-surface)',
                      border: '1px solid var(--admin-border)',
                      color: '#F5EDE0',
                    }}
                  />
                </div>
              </div>

              {/* Archive Table inside Modal */}
              <div
                className="rounded-2xl overflow-hidden border"
                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
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
                    {filteredArchive.map((order, i) => (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-white/5"
                        style={{
                          borderBottom: i < filteredArchive.length - 1 ? '1px solid var(--admin-border)' : 'none',
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
                    {filteredArchive.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-sm"
                          style={{ color: 'var(--admin-muted)' }}
                        >
                          No completed or cancelled orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-5 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }}
              >
                Close Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
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