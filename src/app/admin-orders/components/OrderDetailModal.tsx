'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { getAvailableOrderStatuses, getOrderStatusLabel } from '@/lib/orderWorkflow';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Shipped'
  | 'Completed'
  | 'Cancelled'
  | string;

export interface OrderItem {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
}

export interface Order {
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
  payment_reference?: string | null;
  deposit_amount?: number | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  is_priority: boolean;
  priority_fee: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus, reason?: string) => void;
  updatingId?: string | null;
}

const STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready',
  'Shipped',
  'Completed',
  'Cancelled',
];

function getAvailableStatuses(order: Order): OrderStatus[] {
  return getAvailableOrderStatuses(order.delivery_method, order.status, STATUS_OPTIONS);
}

const PAYMENT_LABELS: Record<string, string> = {
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash on Pickup',
  cash_on_delivery: 'Cash on Delivery',
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-700' },
  confirmed: { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-700' },
  preparing: { bg: 'bg-orange-100 border-orange-200', text: 'text-orange-700' },
  ready: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700' },
  shipped: { bg: 'bg-purple-100 border-purple-200', text: 'text-purple-700' },
  completed: { bg: 'bg-green-100 border-green-200', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100 border-red-200', text: 'text-red-700' },
};

export default function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate,
  updatingId,
}: OrderDetailModalProps) {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('Pending');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (order) {
      setCurrentStatus(order.status || 'Pending');
    }
  }, [order]);

  if (!mounted || !order) return null;

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) return;

    if (newStatus === 'Confirmed') {
      setPaymentVerified(false);
      setShowPaymentConfirmation(true);
      return;
    }

    await updateOrderStatus(newStatus);
  };

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) return;

    const cancellationReason =
      newStatus === 'Cancelled'
        ? window.prompt('Please enter a reason for cancelling this order:')?.trim()
        : undefined;
    if (newStatus === 'Cancelled' && !cancellationReason) return;

    setUpdating(true);
    setEmailStatus('idle');
    setEmailError('');

    try {
      // 1. Update status in Supabase (avoiding RLS select blocks)
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(cancellationReason ? { notes: `Cancelled: ${cancellationReason}` } : {}),
        })
        .eq('id', order.id);

      if (error) {
        console.error('Supabase status update error:', error);
        throw error;
      }

      setCurrentStatus(newStatus);

      setEmailStatus('sending');
      try {
        const response = await fetch('/api/admin/orders/status-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        });
        if (response.ok) {
          setEmailStatus('sent');
        } else {
          const result = (await response.json()) as { error?: string };
          console.error('Failed to send order status email:', result.error);
          setEmailError(result.error || 'The customer email could not be sent.');
          setEmailStatus('error');
        }
      } catch (emailError) {
        console.error('Failed to send order status email:', emailError);
        setEmailError('Unable to contact the email service.');
        setEmailStatus('error');
      }

      // Notify the parent so its order list reflects the saved status.
      if (onStatusUpdate) {
        onStatusUpdate(order.id, newStatus, cancellationReason);
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const normStatus = currentStatus.toLowerCase();
  const badge = STATUS_BADGE[normStatus] || STATUS_BADGE.pending;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-primary">
                #{order.order_number}
              </span>
              {order.is_priority && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  PRIORITY
                </span>
              )}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text}`}
              >
                {getOrderStatusLabel(order.delivery_method, currentStatus)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Placed on {new Date(order.created_at).toLocaleString('en-PH')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Updater */}
          <div className="bg-muted/40 p-4 rounded-xl border border-border">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Update Order Status
            </label>
            <div className="flex flex-wrap gap-2">
              {getAvailableStatuses(order).map((status) => {
                const isActive = currentStatus.toLowerCase() === status.toLowerCase();
                const isCurrentlyUpdating = updating || updatingId === order.id;

                return (
                  <button
                    key={status}
                    disabled={isCurrentlyUpdating}
                    onClick={() => handleStatusChange(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                    } disabled:opacity-50`}
                  >
                    {getOrderStatusLabel(order.delivery_method, status)}
                  </button>
                );
              })}
            </div>

            {/* Email status indicator */}
            {emailStatus === 'sending' && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 font-medium">
                <Icon name="ArrowPathIcon" size={14} className="animate-spin" />
                Sending order update email to customer...
              </p>
            )}
            {emailStatus === 'sent' && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5 font-medium">
                <Icon name="CheckCircleIcon" size={14} />
                Order update email sent successfully to {order.customer_email}!
              </p>
            )}
            {emailStatus === 'error' && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                <Icon name="ExclamationCircleIcon" size={14} />
                {emailError || 'Status updated, but failed to send the customer email.'}
              </p>
            )}
          </div>

          {/* Customer & Fulfillment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Icon name="UserIcon" size={14} />
                Customer Details
              </h4>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">{order.customer_name}</p>
                <p className="text-muted-foreground">{order.customer_email}</p>
                <p className="text-muted-foreground">{order.customer_phone}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Icon name="TruckIcon" size={14} />
                Fulfillment Details
              </h4>
              <div className="space-y-1 text-sm">
                <p className="capitalize">
                  <span className="font-medium text-foreground">Type:</span> {order.delivery_method}
                </p>
                {order.delivery_address && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Address:</span>{' '}
                    {order.delivery_address}
                  </p>
                )}
                {order.event_date && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Event Date:</span>{' '}
                    {order.event_date} {order.event_time ? `(${order.event_time})` : ''}
                  </p>
                )}
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Payment:</span>{' '}
                  {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">50% Deposit:</span> ₱
                  {Number(order.deposit_amount || 0).toLocaleString()}
                </p>
                <p className="break-all text-muted-foreground">
                  <span className="font-medium text-foreground">GCash Reference:</span>{' '}
                  {order.payment_reference || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Icon name="ShoppingBagIcon" size={14} />
              Ordered Items
            </h4>
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex items-center justify-between text-sm bg-card"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.menu_item_name}</p>
                    {item.notes && (
                      <p className="text-xs text-amber-700 mt-1 italic">Note: {item.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ₱{Number(item.unit_price).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    ₱{Number(item.subtotal).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="mt-4 p-4 rounded-xl bg-muted/20 border border-border space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₱{Number(order.subtotal || 0).toLocaleString()}</span>
              </div>
              {Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>₱{Number(order.delivery_fee).toLocaleString()}</span>
                </div>
              )}
              {Number(order.priority_fee) > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Priority Order Fee</span>
                  <span>₱{Number(order.priority_fee).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border mt-2">
                <span>Total Amount</span>
                <span className="text-primary">
                  ₱{Number(order.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end bg-muted/20">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      {showPaymentConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="payment-confirmation-title"
            aria-describedby="payment-confirmation-description"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <Icon name="ExclamationTriangleIcon" size={24} className="text-amber-500" />
              <h3 id="payment-confirmation-title" className="text-lg font-bold text-foreground">
                Confirm Payment Received
              </h3>
            </div>
            <p
              id="payment-confirmation-description"
              className="text-sm leading-relaxed text-muted-foreground"
            >
              Compare the submitted reference with the GCash transaction and verify that the 50%
              deposit was received. If the amount or reference does not match, choose Wait for
              Payment and leave the order Pending.
            </p>
            <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
              <p>
                <span className="font-semibold">Deposit:</span> ₱
                {Number(order.deposit_amount || 0).toLocaleString()}
              </p>
              <p className="break-all">
                <span className="font-semibold">Reference:</span>{' '}
                {order.payment_reference || 'Not provided'}
              </p>
            </div>
            {order.payment_reference ? (
              <label className="mt-4 flex items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={paymentVerified}
                  onChange={(event) => setPaymentVerified(event.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                I verified that the GCash reference matches the received 50% deposit.
              </label>
            ) : (
              <p className="mt-4 text-sm font-medium text-red-600">
                This order has no GCash reference number and cannot be confirmed.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentConfirmation(false);
                  setPaymentVerified(false);
                }}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Wait for Payment
              </button>
              <button
                type="button"
                disabled={
                  updating ||
                  updatingId === order.id ||
                  !order.payment_reference?.trim() ||
                  !paymentVerified
                }
                onClick={() => {
                  setShowPaymentConfirmation(false);
                  setPaymentVerified(false);
                  void updateOrderStatus('Confirmed');
                }}
                className="rounded-xl gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                Yes, Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
