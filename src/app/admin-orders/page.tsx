'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import OrderDetailModal from './components/OrderDetailModal';

type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Shipped' | 'Completed' | 'Cancelled';

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
  customer_email: string;
  customer_phone: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_address: string | null;
  event_date: string | null;
  event_time: string | null;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  Pending: { bg: 'rgba(234,179,8,0.15)', text: '#EAB308' },
  Confirmed: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' },
  Preparing: { bg: 'rgba(249,115,22,0.15)', text: '#FB923C' },
  Ready: { bg: 'rgba(34,197,94,0.15)', text: '#4ADE80' },
  Shipped: { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA' },
  Completed: { bg: 'rgba(100,116,139,0.15)', text: '#94A3B8' },
  Cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#F87171' },
};

const ALL_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Shipped', 'Completed', 'Cancelled'];

const PAYMENT_LABELS: Record<string, string> = {
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
};

const ACTION_CONFIRM_LABELS: Record<OrderStatus, string> = {
  Pending: 'confirm this order',
  Confirmed: 'move this order to Preparing',
  Preparing: 'mark this order as Ready',
  Ready: 'mark this order as Shipped',
  Shipped: 'mark this order as Completed',
  Completed: 'mark this order as Completed',
  Cancelled: 'cancel this order',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<{ orderId: string; nextStatus: OrderStatus; label: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Toast Notification state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  
  // Memoize Supabase Client instance to prevent recreating it on every render cycle
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

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

  // Real-time subscription for new/updated orders
  useEffect(() => {
    const channel = supabase
      .channel('admin_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Re-fetch orders on real-time change to maintain relational integrity with order_items
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchOrders]);

  const toggleActionMenu = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionMenuOpen === orderId) {
      setActionMenuOpen(null);
      setMenuPos(null);
    } else {
      const btn = buttonRefs.current[orderId];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        // Fixed positioning should use client coordinates without window scroll offsets
        setMenuPos({
          top: rect.bottom + 6,
          left: rect.right - 208,
        });
      }
      setActionMenuOpen(orderId);
    }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
    setUpdatingId(orderId);
    try {
      const updateData: { status: OrderStatus; updated_at: string; notes?: string } = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'Cancelled' && reason) {
        const currentOrder = orders.find((o) => o.id === orderId);
        const prevNotes = currentOrder?.notes ? `${currentOrder.notes}\n` : '';
        updateData.notes = `${prevNotes}[Cancellation Reason]: ${reason}`;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update status:', updateError.message);
        addToast('error', `Failed to update status: ${updateError.message}`);
      } else {
        const orderNum = orders.find((o) => o.id === orderId)?.order_number || '';
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...updateData } : o))
        );
        setSelectedOrder((prev) =>
          prev && prev.id === orderId ? { ...prev, ...updateData } : prev
        );
        addToast('success', `Order ${orderNum} status updated to ${newStatus}`);
      }
    } catch {
      console.error('Status update failed');
      addToast('error', 'Status update failed. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = filterStatus === 'All' || o.status === filterStatus;
      const matchSearch =
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, filterStatus, search]);

  const counts = useMemo(() => {
    return ALL_STATUSES.reduce((acc, s) => {
      acc[s] = orders.filter((o) => o.status === s).length;
      return acc;
    }, {} as Record<OrderStatus, number>);
  }, [orders]);

  const confirmingOrder = confirmingAction
    ? orders.find((o) => o.id === confirmingAction.orderId) || null
    : null;

  const activeMenuOrder = actionMenuOpen
    ? orders.find((o) => o.id === actionMenuOpen) || null
    : null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminTopbar />
        <div className="px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>Orders</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                {loading ? 'Loading...' : `${orders.length} total order${orders.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 hover:opacity-80"
              style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }}
            >
              <Icon name="ArrowPathIcon" size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
              <Icon name="ExclamationCircleIcon" size={16} />
              {error}
            </div>
          )}

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('All')}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
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
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
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

          {/* Search */}
          <div className="relative max-w-sm">
            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order # or customer..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }}
            />
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-xl" style={{ background: 'var(--admin-surface)' }} />
              ))}
            </div>
          )}

          {!loading && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    {['Order #', 'Customer', 'Items', 'Total', 'Method', 'Payment', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--admin-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
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
                      <td className="px-4 py-3 font-mono text-xs font-semibold">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="hover:underline text-left transition-all flex items-center gap-1 focus:outline-none"
                          style={{ color: '#D4A017' }}
                          title="Click to view details"
                        >
                          {order.order_number}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: '#F5EDE0' }}>{order.customer_name}</p>
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
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: STATUS_COLORS[order.status]?.bg,
                            color: STATUS_COLORS[order.status]?.text,
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          ref={(el) => { buttonRefs.current[order.id] = el; }}
                          onClick={(e) => toggleActionMenu(order.id, e)}
                          disabled={updatingId === order.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(55,65,81,0.15)', color: '#F5EDE0', border: '1px solid rgba(148,163,184,0.4)' }}
                        >
                          <Icon name="Bars3BottomRightIcon" size={12} />
                          Actions
                          <Icon name="ChevronDownIcon" size={12} />
                        </button>
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

      {/* TOAST NOTIFICATIONS PORTAL */}
      {mounted && createPortal(
        <div className="fixed top-5 right-5 z-[10001] flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-medium transition-all"
              style={{
                background: toast.type === 'success' ? '#181512' : '#2A1212',
                borderColor: toast.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)',
                color: toast.type === 'success' ? '#4ADE80' : '#F87171',
              }}
            >
              <Icon
                name={toast.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'}
                size={18}
              />
              <span>{toast.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* REACT PORTAL DROPDOWN MENU */}
      {mounted && activeMenuOrder && menuPos && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={() => {
              setActionMenuOpen(null);
              setMenuPos(null);
            }}
          />
          <div
            className="fixed z-[9999] w-52 rounded-2xl border shadow-2xl"
            style={{
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              background: '#181512',
              borderColor: 'var(--admin-border, #332E2B)',
            }}
          >
            <div className="flex flex-col p-2 gap-1">
              {activeMenuOrder.status === 'Pending' && (
                <button
                  onClick={() => {
                    setActionMenuOpen(null);
                    setConfirmingAction({
                      orderId: activeMenuOrder.id,
                      nextStatus: 'Confirmed',
                      label: ACTION_CONFIRM_LABELS.Confirmed,
                    });
                  }}
                  disabled={updatingId === activeMenuOrder.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/10 disabled:opacity-50"
                  style={{ color: '#60A5FA' }}
                >
                  <Icon name="CheckCircleIcon" size={14} />
                  Mark Confirmed
                </button>
              )}

              {(activeMenuOrder.status === 'Pending' || activeMenuOrder.status === 'Confirmed') && (
                <button
                  onClick={() => {
                    setActionMenuOpen(null);
                    setConfirmingAction({
                      orderId: activeMenuOrder.id,
                      nextStatus: 'Preparing',
                      label: ACTION_CONFIRM_LABELS.Preparing,
                    });
                  }}
                  disabled={updatingId === activeMenuOrder.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/10 disabled:opacity-50"
                  style={{ color: '#FB923C' }}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FB923C]" />
                  Mark Preparing
                </button>
              )}

              {activeMenuOrder.status !== 'Ready' && activeMenuOrder.status !== 'Shipped' && activeMenuOrder.status !== 'Completed' && activeMenuOrder.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    setActionMenuOpen(null);
                    setConfirmingAction({
                      orderId: activeMenuOrder.id,
                      nextStatus: 'Ready',
                      label: ACTION_CONFIRM_LABELS.Ready,
                    });
                  }}
                  disabled={updatingId === activeMenuOrder.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/10 disabled:opacity-50"
                  style={{ color: '#4ADE80' }}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]" />
                  Mark Ready
                </button>
              )}

              {activeMenuOrder.status !== 'Shipped' && activeMenuOrder.status !== 'Completed' && activeMenuOrder.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    setActionMenuOpen(null);
                    setConfirmingAction({
                      orderId: activeMenuOrder.id,
                      nextStatus: 'Shipped',
                      label: ACTION_CONFIRM_LABELS.Shipped,
                    });
                  }}
                  disabled={updatingId === activeMenuOrder.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/10 disabled:opacity-50"
                  style={{ color: '#A78BFA' }}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#A78BFA]" />
                  Mark Shipped
                </button>
              )}

              {activeMenuOrder.status !== 'Completed' && activeMenuOrder.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    setActionMenuOpen(null);
                    setConfirmingAction({
                      orderId: activeMenuOrder.id,
                      nextStatus: 'Completed',
                      label: ACTION_CONFIRM_LABELS.Completed,
                    });
                  }}
                  disabled={updatingId === activeMenuOrder.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/10 disabled:opacity-50"
                  style={{ color: '#94A3B8' }}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94A3B8]" />
                  Mark Completed
                </button>
              )}

              {activeMenuOrder.status !== 'Cancelled' && activeMenuOrder.status !== 'Completed' && (
                <button
                  onClick={() => {
                    setActionMenuOpen(null);
                    setCancelReason('');
                    setConfirmingAction({
                      orderId: activeMenuOrder.id,
                      nextStatus: 'Cancelled',
                      label: ACTION_CONFIRM_LABELS.Cancelled,
                    });
                  }}
                  disabled={updatingId === activeMenuOrder.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/10 disabled:opacity-50"
                  style={{ color: '#F87171' }}
                >
                  <Icon name="XCircleIcon" size={14} />
                  Cancel
                </button>
              )}

              {(activeMenuOrder.status === 'Completed' || activeMenuOrder.status === 'Cancelled') && (
                <span className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted)' }}>
                  No actions available
                </span>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Confirmation Modal */}
      {confirmingOrder && confirmingAction && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => {
            setConfirmingAction(null);
            setCancelReason('');
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#F5EDE0' }}>
              {confirmingAction.nextStatus === 'Cancelled' ? 'Cancel Order' : 'Confirm Action'}
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--admin-muted)' }}>
              Are you sure you want to {confirmingAction.label} for order <span className="font-semibold text-[#F5EDE0]">{confirmingOrder.order_number}</span>?
            </p>

            {/* Reason input for cancellation */}
            {confirmingAction.nextStatus === 'Cancelled' && (
              <div className="mb-5 space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: '#F5EDE0' }}>
                  Reason for Cancellation <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancelling this order..."
                  className="w-full p-3 rounded-xl text-xs outline-none transition-all focus:border-[#F87171]"
                  style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }}
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setConfirmingAction(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/10"
                style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-muted)' }}
              >
                Cancel
              </button>
              <button
                disabled={confirmingAction.nextStatus === 'Cancelled' && !cancelReason.trim()}
                onClick={() => {
                  updateStatus(confirmingOrder.id, confirmingAction.nextStatus, cancelReason);
                  setConfirmingAction(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{
                  background: confirmingAction.nextStatus === 'Cancelled' ? '#EF4444' : '#3B82F6',
                  color: '#FFFFFF',
                  border: `1px solid ${confirmingAction.nextStatus === 'Cancelled' ? '#F87171' : '#60A5FA'}`,
                }}
              >
                {confirmingAction.nextStatus === 'Cancelled' ? 'Confirm Cancellation' : 'Yes, continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          selectedOrder={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={updateStatus}
          updatingId={updatingId}
        />
      )}
    </div>
  );
}