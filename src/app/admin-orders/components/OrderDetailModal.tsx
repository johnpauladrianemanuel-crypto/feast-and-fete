'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

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

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  updatingId: string | null;
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  Pending:   { bg: 'rgba(234,179,8,0.15)',    text: '#EAB308', border: 'rgba(234,179,8,0.4)' },
  Confirmed: { bg: 'rgba(59,130,246,0.15)',   text: '#60A5FA', border: 'rgba(59,130,246,0.4)' },
  Preparing: { bg: 'rgba(249,115,22,0.15)',   text: '#FB923C', border: 'rgba(249,115,22,0.4)' },
  Ready:     { bg: 'rgba(34,197,94,0.15)',    text: '#4ADE80', border: 'rgba(34,197,94,0.4)' },
  Shipped:   { bg: 'rgba(139,92,246,0.15)',   text: '#A78BFA', border: 'rgba(139,92,246,0.4)' },
  Completed: { bg: 'rgba(100,116,139,0.15)',  text: '#94A3B8', border: 'rgba(100,116,139,0.4)' },
  Cancelled: { bg: 'rgba(239,68,68,0.1)',     text: '#F87171', border: 'rgba(239,68,68,0.3)' },
};

const STATUS_FLOW: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Shipped', 'Completed'];

const PAYMENT_LABELS: Record<string, string> = {
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash on Delivery',
};

const PAYMENT_ICONS: Record<string, string> = {
  gcash: 'DevicePhoneMobileIcon',
  bank_transfer: 'BuildingLibraryIcon',
  cash: 'BanknotesIcon',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailModal({ order, onClose, onStatusUpdate, updatingId }: OrderDetailModalProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isUpdating = updatingId === order.id;

  const currentStatusIndex = STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  const handleStatusClick = async (status: OrderStatus) => {
    if (isUpdating) return;
    await onStatusUpdate(order.id, status);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}
        >
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold" style={{ color: '#D4A017' }}>
                  {order.order_number}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: STATUS_COLORS[order.status]?.bg,
                    color: STATUS_COLORS[order.status]?.text,
                    border: `1px solid ${STATUS_COLORS[order.status]?.border}`,
                  }}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                Placed {formatDateTime(order.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-white/10"
            style={{ color: 'var(--admin-muted)' }}
          >
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Progress Tracker */}
          {!isCancelled && (
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>
                Order Progress
              </p>
              <div className="flex items-center gap-0">
                {STATUS_FLOW.map((status, idx) => {
                  const isDone = currentStatusIndex >= idx;
                  const isCurrent = currentStatusIndex === idx;
                  const isLast = idx === STATUS_FLOW.length - 1;
                  return (
                    <React.Fragment key={status}>
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                          style={{
                            background: isDone ? STATUS_COLORS[status].bg : 'var(--admin-surface)',
                            border: `2px solid ${isDone ? STATUS_COLORS[status].text : 'var(--admin-border)'}`,
                            color: isDone ? STATUS_COLORS[status].text : 'var(--admin-muted)',
                          }}
                        >
                          {isDone && !isCurrent ? (
                            <Icon name="CheckIcon" size={12} />
                          ) : (
                            <span className="text-[10px]">{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className="text-[10px] font-medium whitespace-nowrap"
                          style={{ color: isCurrent ? STATUS_COLORS[status].text : isDone ? '#F5EDE0' : 'var(--admin-muted)' }}
                        >
                          {status}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className="flex-1 h-0.5 mx-1 mb-4"
                          style={{
                            background: currentStatusIndex > idx ? '#D4A017' : 'var(--admin-border)',
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <Icon name="XCircleIcon" size={18} style={{ color: '#F87171' }} />
              <p className="text-sm font-medium" style={{ color: '#F87171' }}>This order has been cancelled.</p>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Info */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}
            >
              <div className="flex items-center gap-2">
                <Icon name="UserIcon" size={14} style={{ color: '#D4A017' }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>
                  Customer
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold" style={{ color: '#F5EDE0' }}>{order.customer_name}</p>
                {order.customer_email && (
                  <div className="flex items-center gap-2">
                    <Icon name="EnvelopeIcon" size={12} style={{ color: 'var(--admin-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{order.customer_email}</p>
                  </div>
                )}
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Icon name="PhoneIcon" size={12} style={{ color: 'var(--admin-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{order.customer_phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}
            >
              <div className="flex items-center gap-2">
                <Icon name="CreditCardIcon" size={14} style={{ color: '#D4A017' }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>
                  Payment
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon
                    name={PAYMENT_ICONS[order.payment_method] || 'CreditCardIcon'}
                    size={14}
                    style={{ color: '#4ADE80' }}
                  />
                  <p className="text-sm font-semibold" style={{ color: '#F5EDE0' }}>
                    {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                  </p>
                </div>
                <div className="space-y-1 pt-1" style={{ borderTop: '1px solid var(--admin-border)' }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--admin-muted)' }}>Subtotal</span>
                    <span style={{ color: '#F5EDE0' }}>₱{Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  {Number(order.delivery_fee) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--admin-muted)' }}>Delivery Fee</span>
                      <span style={{ color: '#F5EDE0' }}>₱{Number(order.delivery_fee).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid var(--admin-border)' }}>
                    <span style={{ color: '#F5EDE0' }}>Total</span>
                    <span style={{ color: '#D4A017' }}>₱{Number(order.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}
            >
              <div className="flex items-center gap-2">
                <Icon name={order.delivery_method === 'delivery' ? 'TruckIcon' : 'ShoppingBagIcon'} size={14} style={{ color: '#D4A017' }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>
                  {order.delivery_method === 'delivery' ? 'Delivery' : 'Pickup'}
                </p>
              </div>
              <div className="space-y-1.5">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                  style={{ background: 'rgba(212,160,23,0.15)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)' }}
                >
                  {order.delivery_method}
                </span>
                {order.delivery_address && (
                  <div className="flex items-start gap-2 mt-1">
                    <Icon name="MapPinIcon" size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--admin-muted)' }} />
                    <p className="text-xs" style={{ color: '#F5EDE0' }}>{order.delivery_address}</p>
                  </div>
                )}
                {order.event_date && (
                  <div className="flex items-center gap-2">
                    <Icon name="CalendarIcon" size={12} style={{ color: 'var(--admin-muted)' }} />
                    <p className="text-xs" style={{ color: '#F5EDE0' }}>
                      {formatDate(order.event_date)}
                      {order.event_time ? ` at ${order.event_time}` : ''}
                    </p>
                  </div>
                )}
                {!order.delivery_address && !order.event_date && (
                  <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>No address specified</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}
            >
              <div className="flex items-center gap-2">
                <Icon name="ChatBubbleLeftEllipsisIcon" size={14} style={{ color: '#D4A017' }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>
                  Special Notes
                </p>
              </div>
              {order.notes ? (
                <p className="text-xs leading-relaxed" style={{ color: '#F5EDE0' }}>{order.notes}</p>
              ) : (
                <p className="text-xs italic" style={{ color: 'var(--admin-muted)' }}>No special notes</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--admin-border)' }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' }}
            >
              <Icon name="ShoppingCartIcon" size={14} style={{ color: '#D4A017' }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>
                Order Items ({order.order_items?.length ?? 0})
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                  {['Item', 'Qty', 'Unit Price', 'Subtotal'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--admin-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item, i) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: i < (order.order_items?.length ?? 0) - 1 ? '1px solid var(--admin-border)' : 'none',
                      background: 'var(--admin-surface)',
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-sm" style={{ color: '#F5EDE0' }}>
                      {item.menu_item_name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--admin-muted)' }}>
                      ×{item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--admin-muted)' }}>
                      ₱{Number(item.unit_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#F5EDE0' }}>
                      ₱{Number(item.subtotal).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center px-4 py-3 font-bold text-sm" style={{ background: 'var(--admin-bg)', borderTop: '1px solid var(--admin-border)' }}>
              <span style={{ color: '#F5EDE0' }}>Total</span>
              <span style={{ color: '#D4A017' }}>₱{Number(order.total_amount).toLocaleString()}</span>
            </div>
          </div>

          {/* Status Update Section */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="ArrowPathIcon" size={14} style={{ color: '#D4A017' }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>
                  Update Status
                </p>
              </div>
              {isUpdating && (
                <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>Updating…</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Action: Confirm Order Button (Shown when status is Pending) */}
              {order.status === 'Pending' && (
                <button
                  onClick={() => handleStatusClick('Confirmed')}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    border: '1px solid #60A5FA',
                  }}
                >
                  <Icon name="CheckCircleIcon" size={14} />
                  Confirm Order
                </button>
              )}

              {/* Status Selector Pills */}
              {(['Pending', 'Confirmed', 'Preparing', 'Ready', 'Shipped', 'Completed'] as OrderStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusClick(s)}
                  disabled={isUpdating || order.status === s || isCancelled}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: order.status === s ? STATUS_COLORS[s].bg : 'var(--admin-surface)',
                    color: STATUS_COLORS[s].text,
                    border: `1px solid ${order.status === s ? STATUS_COLORS[s].border : 'var(--admin-border)'}`,
                  }}
                >
                  {order.status === s && <span className="mr-1">✓</span>}
                  {s}
                </button>
              ))}

              {/* Cancel button with confirmation */}
              {!isCancelled && order.status !== 'Completed' && (
                confirmCancel ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs" style={{ color: '#F87171' }}>Confirm cancel?</span>
                    <button
                      onClick={() => { handleStatusClick('Cancelled'); setConfirmCancel(false); }}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.4)' }}
                    >
                      Yes, Cancel
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'var(--admin-surface)', color: 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    disabled={isUpdating}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ml-auto"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    Cancel Order
                  </button>
                )
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--admin-muted)' }}>
            <span>Created: {formatDateTime(order.created_at)}</span>
            <span>Last updated: {formatDateTime(order.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}