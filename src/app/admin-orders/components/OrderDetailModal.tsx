'use client';

import React, { useEffect, useState } from 'react';

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
  selectedOrder: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus, reason?: string) => Promise<void>;
  updatingId: string | null;
}

const STATUS_STEPS: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Shipped', 'Completed'];

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  Pending: { bg: 'rgba(234,179,8,0.15)', text: '#EAB308', border: 'rgba(234,179,8,0.3)' },
  Confirmed: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA', border: 'rgba(59,130,246,0.3)' },
  Preparing: { bg: 'rgba(249,115,22,0.15)', text: '#FB923C', border: 'rgba(249,115,22,0.3)' },
  Ready: { bg: 'rgba(34,197,94,0.15)', text: '#4ADE80', border: 'rgba(34,197,94,0.3)' },
  Shipped: { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA', border: 'rgba(139,92,246,0.3)' },
  Completed: { bg: 'rgba(100,116,139,0.15)', text: '#94A3B8', border: 'rgba(100,116,139,0.3)' },
  Cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#F87171', border: 'rgba(239,68,68,0.3)' },
};

export default function OrderDetailModal({
  selectedOrder,
  onClose,
  onStatusUpdate,
  updatingId,
}: OrderDetailModalProps) {
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentStepIndex = STATUS_STEPS.indexOf(selectedOrder.status);
  const isUpdating = updatingId === selectedOrder.id;

  const handleAction = async (newStatus: OrderStatus, reason?: string) => {
    await onStatusUpdate(selectedOrder.id, newStatus, reason);
    if (newStatus === 'Cancelled') {
      setShowCancelInput(false);
      setCancelReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#181512] border border-[#332E2B] rounded-2xl shadow-2xl text-[#F5EDE0] overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#332E2B] flex items-center justify-between bg-[#120F0D]">
          <div>
            <span className="text-xs uppercase tracking-wider text-stone-400">Order Details</span>
            <h2 className="text-xl font-bold font-mono text-[#D4A017]">{selectedOrder.order_number}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Customer & Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#120F0D] p-4 rounded-xl border border-[#2A2420]">
            <div>
              <p className="text-xs text-stone-400">Customer</p>
              <p className="text-sm font-medium">{selectedOrder.customer_name}</p>
              <p className="text-xs text-stone-500">{selectedOrder.customer_email}</p>
              {selectedOrder.customer_phone && (
                <p className="text-xs text-stone-500">{selectedOrder.customer_phone}</p>
              )}
            </div>

            <div className="text-right">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: STATUS_COLORS[selectedOrder.status]?.bg,
                  color: STATUS_COLORS[selectedOrder.status]?.text,
                  border: `1px solid ${STATUS_COLORS[selectedOrder.status]?.border}`,
                }}
              >
                {selectedOrder.status}
              </span>
              <p className="text-[10px] text-stone-500 mt-1">
                Updated: {new Date(selectedOrder.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Progress Tracker */}
          {selectedOrder.status !== 'Cancelled' ? (
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                Order Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {STATUS_STEPS.map((step, idx) => {
                  const isPassed = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={step}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-[#D4A017]/10 border-[#D4A017] text-[#D4A017]'
                          : isPassed
                          ? 'bg-white/5 border-stone-700 text-stone-300'
                          : 'bg-transparent border-stone-800 text-stone-600'
                      }`}
                    >
                      <div className="text-[10px] font-mono mb-0.5">0{idx + 1}</div>
                      <div className="text-[11px] font-medium leading-tight">{step}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-xl text-center">
              <p className="text-red-400 text-sm font-semibold">This Order Was Cancelled</p>
              {selectedOrder.notes && (
                <p className="text-xs text-stone-400 mt-1 whitespace-pre-line">{selectedOrder.notes}</p>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
              Items Ordered
            </h3>
            <div className="divide-y divide-[#2A2420] border-t border-b border-[#2A2420]">
              {selectedOrder.order_items?.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-medium text-[#F5EDE0]">{item.menu_item_name}</p>
                    <p className="text-stone-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-mono text-stone-300">
                    ₱{Number(item.subtotal).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Summary */}
          <div className="bg-[#120F0D] p-4 rounded-xl border border-[#2A2420] space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal</span>
              <span className="font-mono">₱{Number(selectedOrder.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Delivery Fee</span>
              <span className="font-mono">₱{Number(selectedOrder.delivery_fee).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#F5EDE0] pt-2 border-t border-[#2A2420]">
              <span>Total Amount</span>
              <span className="font-mono text-[#D4A017]">
                ₱{Number(selectedOrder.total_amount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Actions inside Modal */}
          {selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Cancelled' && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                Update Order Status
              </h3>

              {showCancelInput ? (
                <div className="space-y-2 bg-[#120F0D] p-3 rounded-xl border border-red-900/50">
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason for cancellation..."
                    className="w-full p-2 rounded-lg text-xs outline-none bg-[#181512] border border-[#332E2B] text-stone-200"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowCancelInput(false)}
                      className="px-3 py-1 rounded-lg text-xs bg-stone-800 text-stone-300"
                    >
                      Back
                    </button>
                    <button
                      disabled={!cancelReason.trim() || isUpdating}
                      onClick={() => handleAction('Cancelled', cancelReason)}
                      className="px-3 py-1 rounded-lg text-xs bg-red-600 text-white disabled:opacity-50 flex items-center gap-1"
                    >
                      {isUpdating ? 'Saving...' : 'Confirm Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'Pending' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleAction('Confirmed')}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark Confirmed'}
                    </button>
                  )}
                  {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Confirmed') && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleAction('Preparing')}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark Preparing'}
                    </button>
                  )}
                  {selectedOrder.status !== 'Ready' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleAction('Ready')}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark Ready'}
                    </button>
                  )}
                  {selectedOrder.status !== 'Shipped' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleAction('Shipped')}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark Shipped'}
                    </button>
                  )}
                  <button
                    disabled={isUpdating}
                    onClick={() => handleAction('Completed')}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-500/20 text-stone-300 border border-stone-500/30 hover:bg-stone-500/30 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Mark Completed'}
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => setShowCancelInput(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#332E2B] bg-[#120F0D] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}