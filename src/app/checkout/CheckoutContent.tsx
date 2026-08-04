'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cartContext';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type DeliveryMethod = 'delivery' | 'pickup';
type PaymentMethod = 'cash_on_delivery' | 'card' | 'bank_transfer';

interface ContactForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  eventDate: string;
  eventTime: string;
  paymentMethod: PaymentMethod;
}

interface OrderSuccess {
  orderId: string;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  total: number;
  eventDate: string;
  eventTime: string;
  deliveryMethod: DeliveryMethod;
}

// Payment Review state — shown after form submit, before order creation
interface PaymentReviewData {
  form: ContactForm;
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash_on_delivery: 'Cash on Delivery',
  card: 'Credit / Debit Card',
  bank_transfer: 'Bank Transfer',
};

const PAYMENT_ICONS: Record<PaymentMethod, string> = {
  cash_on_delivery: '💵',
  card: '💳',
  bank_transfer: '🏦',
};

// ── Guest profile helpers ────────────────────────────────────────────────────
function getGuestProfile(): { id: string; contactType: string; contactValue: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = localStorage.getItem('guestProfileId');
    const contactType = localStorage.getItem('guestContactType');
    const contactValue = localStorage.getItem('guestContactValue');
    if (id && contactType && contactValue) return { id, contactType, contactValue };
  } catch { /* ignore */ }
  return null;
}

export default function CheckoutContent() {
  const { state, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [form, setForm] = useState<ContactForm>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    eventDate: '',
    eventTime: '',
    paymentMethod: 'cash_on_delivery',
  });
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savedAddress, setSavedAddress] = useState('');
  const [usingSavedAddress, setUsingSavedAddress] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [showOrderLoading, setShowOrderLoading] = useState(false);
  const [guestProfile, setGuestProfile] = useState<{ id: string; contactType: string; contactValue: string } | null>(null);

  // Payment review state — shown between form submit and order creation
  const [paymentReview, setPaymentReview] = useState<PaymentReviewData | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState(false);

  const deliveryFee = deliveryMethod === 'delivery' ? 150 : 0;
  const total = totalAmount + deliveryFee;

  // Load guest profile from localStorage
  useEffect(() => {
    const gp = getGuestProfile();
    setGuestProfile(gp);
    if (gp && !user) {
      // Pre-fill contact field from verified guest profile
      setForm(prev => ({
        ...prev,
        email: gp.contactType === 'email' ? gp.contactValue : prev.email,
        phone: gp.contactType === 'phone' ? gp.contactValue : prev.phone,
      }));
      setProfileLoaded(true);
    }
  }, [user]);

  // Pre-fill form from user profile (authenticated users)
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('user_profiles')
      .select('full_name, email, phone, address')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const profileAddress = data.address || '';
          setSavedAddress(profileAddress);
          setForm(prev => ({
            ...prev,
            fullName: data.full_name || prev.fullName,
            email: data.email || user.email || prev.email,
            phone: data.phone || prev.phone,
            address: profileAddress || prev.address,
          }));
          if (profileAddress) {
            setUsingSavedAddress(true);
          }
        } else {
          setForm(prev => ({ ...prev, email: user.email || prev.email }));
        }
        setProfileLoaded(true);
      });
  }, [user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'address') setUsingSavedAddress(false);
    if (errors[name as keyof ContactForm]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  function applySavedAddress() {
    setForm(prev => ({ ...prev, address: savedAddress }));
    setUsingSavedAddress(true);
    if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
  }

  function validate(): boolean {
    const newErrors: Partial<ContactForm> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (deliveryMethod === 'delivery' && !form.address.trim()) newErrors.address = 'Delivery address is required';
    if (!form.eventDate) newErrors.eventDate = 'Event date is required';
    if (!form.eventTime) newErrors.eventTime = 'Event time is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Step 1: Validate form → show payment review screen
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError('');

    // Show payment review before creating the order
    const deliveryAddress = deliveryMethod === 'delivery'
      ? `${form.address}${form.city ? ', ' + form.city : ''}`
      : 'Pickup at Feast & Fête Kitchen';

    setPaymentReview({
      form,
      deliveryMethod,
      subtotal: totalAmount,
      deliveryFee,
      total,
    });
    // Store delivery address for later use
    sessionStorage.setItem('feastfete_pending_delivery_address', deliveryAddress);
  }

  // Step 2: User confirms on payment review → create order
  async function handleConfirmOrder() {
    if (!paymentReview) return;
    setConfirmingOrder(true);
    setSubmitError('');

    const deliveryAddress = sessionStorage.getItem('feastfete_pending_delivery_address') || '';
    const orderId = `FF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;

    try {
      const supabase = createClient();

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderId,
          user_id: user?.id ?? null,
          guest_profile_id: (!user && guestProfile) ? guestProfile.id : null,
          customer_name: form.fullName,
          customer_email: form.email,
          customer_phone: form.phone,
          delivery_method: deliveryMethod,
          delivery_address: deliveryAddress,
          event_date: form.eventDate,
          event_time: form.eventTime,
          payment_method: form.paymentMethod,
          notes: form.notes,
          subtotal: totalAmount,
          delivery_fee: deliveryFee,
          total_amount: total,
          status: 'Pending',
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Order insert error:', orderError.message);
        setSubmitError('Failed to place order: ' + orderError.message);
        setConfirmingOrder(false);
        return;
      }

      if (orderData) {
        const itemsToInsert = state.items.map(item => ({
          order_id: orderData.id,
          menu_item_id: item.menuItem.id,
          menu_item_name: item.menuItem.name,
          quantity: item.quantity,
          unit_price: item.menuItem.price,
          subtotal: item.menuItem.price * item.quantity,
        }));
        await supabase.from('order_items').insert(itemsToInsert);
      }
    } catch (err) {
      console.error('Supabase order save error:', err);
      setSubmitError('Something went wrong. Please try again.');
      setConfirmingOrder(false);
      return;
    }

    // Save to sessionStorage for confirmation page
    const orderPayload = {
      orderId,
      customerName: form.fullName,
      email: form.email,
      phone: form.phone,
      deliveryMethod,
      address: deliveryAddress,
      eventDate: form.eventDate,
      eventTime: form.eventTime,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      items: state.items,
      subtotal: totalAmount,
      deliveryFee,
      total,
      isGuest: !user && !!guestProfile,
      guestProfileId: guestProfile?.id ?? null,
    };
    sessionStorage.setItem('feastfete_order', JSON.stringify(orderPayload));
    clearCart();
    setPaymentReview(null);

    // Show full-screen loading before confirmation
    setShowOrderLoading(true);
    setTimeout(() => {
      setShowOrderLoading(false);
      setOrderSuccess({
        orderId,
        paymentMethod: form.paymentMethod,
        deliveryAddress,
        total,
        eventDate: form.eventDate,
        eventTime: form.eventTime,
        deliveryMethod,
      });
      setConfirmingOrder(false);
    }, 3000);
  }

  // Step 2 (retry): Go back to form from payment review
  function handleRetryCheckout() {
    setPaymentReview(null);
    setSubmitError('');
  }

  // Countdown timer for redirect after order success
  useEffect(() => {
    if (!orderSuccess) return;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/order-confirmation');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orderSuccess, router]);

  if (state.items.length === 0 && !submitting && !orderSuccess && !showOrderLoading && !paymentReview) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNavbar />
        <CartDrawer />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Icon name="ShoppingCartIcon" size={36} className="text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">No items to checkout</h2>
          <p className="text-muted-foreground mb-6">Your cart is empty. Add items before checking out.</p>
          <Link href="/menu-browse-screen" className="px-6 py-3 gradient-brand text-primary-foreground font-semibold rounded-xl btn-3d">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  // ── Payment Review Screen ─────────────────────────────────────────────────
  if (paymentReview) {
    const formattedDate = paymentReview.form.eventDate
      ? new Date(paymentReview.form.eventDate + 'T00:00:00').toLocaleDateString('en-PH', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    return (
      <div className="min-h-screen bg-background">
        <CustomerNavbar />
        <CartDrawer />
        <div className="max-w-lg mx-auto px-4 py-12 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={handleRetryCheckout}
              className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Go back to checkout form"
            >
              <Icon name="ArrowLeftIcon" size={16} className="text-foreground" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Review Your Order</h1>
              <p className="text-sm text-muted-foreground">Confirm details before placing your order</p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                <Icon name="CheckIcon" size={12} className="text-primary" />
              </div>
              <span className="text-xs font-medium text-primary">Details</span>
            </div>
            <div className="flex-1 h-0.5 bg-primary/30 rounded-full" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center">
                <Icon name="CreditCardIcon" size={12} className="text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold text-foreground">Review</span>
            </div>
            <div className="flex-1 h-0.5 bg-border rounded-full" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <Icon name="ClipboardDocumentCheckIcon" size={12} className="text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Confirmed</span>
            </div>
          </div>

          {/* Payment Method Highlight */}
          <div
            className="bg-card rounded-2xl border-2 border-primary/30 p-6 mb-5"
            style={{ boxShadow: 'var(--shadow-3d)' }}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment Method</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
                {PAYMENT_ICONS[paymentReview.form.paymentMethod]}
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{PAYMENT_LABELS[paymentReview.form.paymentMethod]}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {paymentReview.form.paymentMethod === 'cash_on_delivery' && 'Pay in cash when your order arrives'}
                  {paymentReview.form.paymentMethod === 'card' && 'Visa, Mastercard, or any major card'}
                  {paymentReview.form.paymentMethod === 'bank_transfer' && 'BDO / BPI / UnionBank'}
                </p>
              </div>
              <button
                onClick={handleRetryCheckout}
                className="ml-auto text-xs text-primary font-medium hover:underline flex items-center gap-1 flex-shrink-0"
              >
                <Icon name="PencilIcon" size={12} />
                Change
              </button>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-card rounded-2xl border border-border p-5 mb-5" style={{ boxShadow: 'var(--shadow-3d)' }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Items Ordered</p>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {state.items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-foreground font-medium">{item.menuItem.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                  <span className="font-semibold text-foreground tabular-nums">₱{(item.menuItem.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground tabular-nums">₱{paymentReview.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="text-foreground tabular-nums">{paymentReview.deliveryFee === 0 ? 'Free' : `₱${paymentReview.deliveryFee}`}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span className="text-foreground">Order Total</span>
                <span className="text-primary tabular-nums text-lg">₱{paymentReview.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Contact Summary */}
          <div className="bg-card rounded-2xl border border-border p-5 mb-5" style={{ boxShadow: 'var(--shadow-3d)' }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Delivery & Contact</p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Icon name="UserIcon" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{paymentReview.form.fullName}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon name="EnvelopeIcon" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{paymentReview.form.email}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon name="PhoneIcon" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{paymentReview.form.phone}</span>
              </div>
              {paymentReview.deliveryMethod === 'delivery' && paymentReview.form.address && (
                <div className="flex items-start gap-2.5">
                  <Icon name="MapPinIcon" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{paymentReview.form.address}{paymentReview.form.city ? `, ${paymentReview.form.city}` : ''}</span>
                </div>
              )}
              {paymentReview.deliveryMethod === 'pickup' && (
                <div className="flex items-start gap-2.5">
                  <Icon name="BuildingStorefrontIcon" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Pickup at Feast & Fête Kitchen</span>
                </div>
              )}
              {formattedDate && (
                <div className="flex items-start gap-2.5">
                  <Icon name="CalendarDaysIcon" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{formattedDate}{paymentReview.form.eventTime ? ` · ${paymentReview.form.eventTime}` : ''}</span>
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
              <Icon name="ExclamationCircleIcon" size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirmOrder}
              disabled={confirmingOrder}
              className="w-full py-4 gradient-brand text-primary-foreground font-bold text-base rounded-2xl btn-3d transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {confirmingOrder ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Placing Order...
                </>
              ) : (
                <>
                  <Icon name="CheckCircleIcon" size={20} />
                  Confirm & Place Order
                </>
              )}
            </button>
            <button
              onClick={handleRetryCheckout}
              disabled={confirmingOrder}
              className="w-full py-3 border-2 border-border bg-card text-foreground font-semibold text-sm rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon name="ArrowLeftIcon" size={16} />
              Edit Order Details
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By confirming, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    );
  }

  // ── Full-screen Order Loading Overlay ────────────────────────────────────
  if (showOrderLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
        {/* Animated spinner */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full gradient-brand flex items-center justify-center" style={{ boxShadow: 'var(--shadow-3d)' }}>
            <Icon name="ClipboardDocumentListIcon" size={40} className="text-primary-foreground" />
          </div>
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" style={{ margin: '-6px' }} />
        </div>

        {/* Message */}
        <div className="text-center max-w-sm px-6">
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Order Submitted!</h2>
          <p className="text-muted-foreground text-base leading-relaxed mb-6">
            Your order is being reviewed by our admin — check{' '}
            <span className="font-semibold text-primary">Track Order</span> to see the status of your order.
          </p>

          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Track Order hint */}
        <div className="mt-10 flex items-center gap-2 px-5 py-3 bg-primary/10 border border-primary/20 rounded-xl">
          <Icon name="MagnifyingGlassIcon" size={18} className="text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">
            You can track your order under <strong>Track Order</strong> in your dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ── Order Success Summary Screen ─────────────────────────────────────────
  if (orderSuccess) {
    const formattedDate = orderSuccess.eventDate
      ? new Date(orderSuccess.eventDate + 'T00:00:00').toLocaleDateString('en-PH', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    return (
      <div className="min-h-screen bg-background">
        <CustomerNavbar />
        <CartDrawer />
        <div className="max-w-lg mx-auto px-4 py-16 lg:px-8">
          {/* Success icon + heading */}
          <div className="bg-card rounded-2xl border border-border p-8 text-center mb-6" style={{ boxShadow: 'var(--shadow-3d)' }}>
            <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckIcon" size={32} className="text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Order Placed!</h1>
            <p className="text-muted-foreground text-sm mb-4">Your order has been received and is being processed.</p>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-5 py-2.5">
              <Icon name="HashtagIcon" size={16} className="text-primary" />
              <span className="font-mono text-base font-bold text-primary tracking-wider">{orderSuccess.orderId}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Save this order number for tracking</p>
          </div>

          {/* Summary details */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 space-y-4" style={{ boxShadow: 'var(--shadow-3d)' }}>
            <h2 className="font-display text-base font-bold text-foreground">Order Summary</h2>

            {/* Payment Method */}
            <div className="flex items-center gap-3 py-3 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="CreditCardIcon" size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <p className="text-sm font-semibold text-foreground">{PAYMENT_LABELS[orderSuccess.paymentMethod]}</p>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="flex items-start gap-3 py-3 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name={orderSuccess.deliveryMethod === 'delivery' ? 'TruckIcon' : 'BuildingStorefrontIcon'} size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{orderSuccess.deliveryMethod === 'delivery' ? 'Delivery Address' : 'Pickup Location'}</p>
                <p className="text-sm font-semibold text-foreground">{orderSuccess.deliveryAddress}</p>
              </div>
            </div>

            {/* Estimated Arrival */}
            <div className="flex items-start gap-3 py-3 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="ClockIcon" size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                <p className="text-sm font-semibold text-foreground">{formattedDate}</p>
                {orderSuccess.eventTime && (
                  <p className="text-xs text-muted-foreground mt-0.5">{orderSuccess.eventTime}</p>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="BanknotesIcon" size={18} className="text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Total Amount</p>
              </div>
              <span className="font-bold text-primary text-lg tabular-nums">₱{orderSuccess.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Redirect countdown */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground text-sm font-bold">{countdown}</span>
            </div>
            <p className="text-sm text-foreground">
              Redirecting to your full order confirmation in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}…
            </p>
          </div>

          {/* Manual CTA */}
          <button
            onClick={() => router.push('/order-confirmation')}
            className="w-full py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all"
          >
            View Full Confirmation →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />

      <div className="max-w-5xl mx-auto px-4 py-10 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/menu-browse-screen" className="hover:text-primary transition-colors">Menu</Link>
          <Icon name="ChevronRightIcon" size={14} />
          <Link href="/cart-review" className="hover:text-primary transition-colors">Cart Review</Link>
          <Icon name="ChevronRightIcon" size={14} />
          <span className="text-foreground font-medium">Checkout</span>
          <Icon name="ChevronRightIcon" size={14} />
          <span className="text-muted-foreground">Confirmation</span>
        </nav>

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-8">Review your details and place your order.</p>

        {/* Logged-in user info banner */}
        {user && profileLoaded && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
            <Icon name="UserCircleIcon" size={20} className="text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">
              Ordering as <strong>{form.fullName || user.email}</strong>. Your saved details have been pre-filled below.
            </p>
            <Link href="/customer-profile" className="ml-auto text-xs text-primary font-medium hover:underline flex-shrink-0">
              Edit Profile
            </Link>
          </div>
        )}

        {/* Guest verified banner */}
        {!user && guestProfile && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
            <Icon name="ShieldCheckIcon" size={20} className="text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">Verified Guest</p>
              <p className="text-xs text-green-700 truncate">
                Ordering as verified {guestProfile.contactType === 'email' ? 'email' : 'phone'}: <strong>{guestProfile.contactValue}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Guest not verified warning */}
        {!user && !guestProfile && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Icon name="ExclamationTriangleIcon" size={20} className="text-amber-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Guest Checkout</p>
              <p className="text-xs text-amber-700">
                Verify your contact via{' '}
                <Link href="/sign-up-login-screen" className="underline font-medium">Login as Guest</Link>
                {' '}to link this order to your profile and enable tracking.
              </p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-6 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <Icon name="ExclamationCircleIcon" size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Delivery / Pickup Toggle */}
              <div className="bg-card rounded-2xl border border-border p-6" style={{ boxShadow: 'var(--shadow-3d)' }}>
                <h2 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="TruckIcon" size={18} className="text-primary" />
                  Fulfillment Method
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      deliveryMethod === 'delivery' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Icon name="TruckIcon" size={24} className={deliveryMethod === 'delivery' ? 'text-primary' : 'text-muted-foreground'} />
                    <span className={`text-sm font-semibold ${deliveryMethod === 'delivery' ? 'text-primary' : 'text-foreground'}`}>Delivery</span>
                    <span className="text-xs text-muted-foreground">+₱150 fee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      deliveryMethod === 'pickup' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Icon name="BuildingStorefrontIcon" size={24} className={deliveryMethod === 'pickup' ? 'text-primary' : 'text-muted-foreground'} />
                    <span className={`text-sm font-semibold ${deliveryMethod === 'pickup' ? 'text-primary' : 'text-foreground'}`}>Pickup</span>
                    <span className="text-xs text-muted-foreground">Free · at our kitchen</span>
                  </button>
                </div>
                {deliveryMethod === 'pickup' && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    <strong>Pickup address:</strong> 12 Mariposa St., Quezon City, Metro Manila. Please bring your order ID.
                  </div>
                )}
              </div>

              {/* Contact Details */}
              <div className="bg-card rounded-2xl border border-border p-6" style={{ boxShadow: 'var(--shadow-3d)' }}>
                <h2 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="UserIcon" size={18} className="text-primary" />
                  Contact Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Full Name <span className="text-error">*</span></label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Maria Santos"
                      className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.fullName ? 'border-error' : 'border-border'}`}
                    />
                    {errors.fullName && <p className="text-xs text-error mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email <span className="text-error">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="maria@example.com"
                      className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.email ? 'border-error' : 'border-border'}`}
                    />
                    {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number <span className="text-error">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+63 917 123 4567"
                      className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.phone ? 'border-error' : 'border-border'}`}
                    />
                    {errors.phone && <p className="text-xs text-error mt-1">{errors.phone}</p>}
                  </div>
                  {deliveryMethod === 'delivery' && (
                    <>
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-foreground">Delivery Address <span className="text-error">*</span></label>
                          {user && savedAddress && !usingSavedAddress && (
                            <button
                              type="button"
                              onClick={applySavedAddress}
                              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                            >
                              <Icon name="MapPinIcon" size={12} />
                              Use saved address
                            </button>
                          )}
                        </div>
                        {user && savedAddress && usingSavedAddress && (
                          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                            <Icon name="MapPinIcon" size={14} className="text-primary flex-shrink-0" />
                            <p className="text-xs text-primary font-medium flex-1">Using your saved address</p>
                            <button
                              type="button"
                              onClick={() => setUsingSavedAddress(false)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Change
                            </button>
                          </div>
                        )}
                        <input
                          type="text"
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          placeholder="House/Unit No., Street, Barangay"
                          className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.address ? 'border-error' : 'border-border'}`}
                        />
                        {errors.address && <p className="text-xs text-error mt-1">{errors.address}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">City / Municipality</label>
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder="Quezon City"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Event Schedule */}
              <div className="bg-card rounded-2xl border border-border p-6" style={{ boxShadow: 'var(--shadow-3d)' }}>
                <h2 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="CalendarDaysIcon" size={18} className="text-primary" />
                  Event Schedule
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Event Date <span className="text-error">*</span></label>
                    <input
                      type="date"
                      name="eventDate"
                      value={form.eventDate}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.eventDate ? 'border-error' : 'border-border'}`}
                    />
                    {errors.eventDate && <p className="text-xs text-error mt-1">{errors.eventDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Preferred Time <span className="text-error">*</span></label>
                    <select
                      name="eventTime"
                      value={form.eventTime}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.eventTime ? 'border-error' : 'border-border'}`}
                    >
                      <option value="">Select time slot</option>
                      <option value="08:00 AM">08:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="12:00 PM">12:00 PM (Noon)</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                    </select>
                    {errors.eventTime && <p className="text-xs text-error mt-1">{errors.eventTime}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Special Instructions <span className="text-muted-foreground text-xs">(optional)</span></label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Allergies, dietary restrictions, special requests..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-2xl border border-border p-6" style={{ boxShadow: 'var(--shadow-3d)' }}>
                <h2 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="CreditCardIcon" size={18} className="text-primary" />
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {[
                    { value: 'cash_on_delivery', label: 'Cash on Delivery', desc: 'Pay in cash when your order arrives', icon: '💵' },
                    { value: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, or any major card', icon: '💳' },
                    { value: 'bank_transfer', label: 'Bank Transfer', desc: 'BDO / BPI / UnionBank', icon: '🏦' },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.paymentMethod === method.value
                          ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={form.paymentMethod === method.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${form.paymentMethod === method.value ? 'text-primary' : 'text-foreground'}`}>{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        form.paymentMethod === method.value ? 'border-primary' : 'border-border'
                      }`}>
                        {form.paymentMethod === method.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24" style={{ boxShadow: 'var(--shadow-3d)' }}>
                <h2 className="font-display text-lg font-bold text-foreground mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto scrollbar-thin">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate pr-2">{item.menuItem.name} ×{item.quantity}</span>
                      <span className="font-medium text-foreground tabular-nums flex-shrink-0">₱{(item.menuItem.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground tabular-nums">₱{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery fee</span>
                    <span className="font-medium text-foreground tabular-nums">{deliveryFee === 0 ? 'Free' : `₱${deliveryFee}`}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-lg tabular-nums">₱{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Delivery address confirmation */}
                {deliveryMethod === 'delivery' && form.address && (
                  <div className="mb-4 p-3 bg-muted rounded-xl border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Delivering to</p>
                    <p className="text-sm text-foreground">{form.address}{form.city ? `, ${form.city}` : ''}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 gradient-brand text-primary-foreground font-semibold text-sm rounded-xl btn-3d transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Review & Confirm →'
                  )}
                </button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  You&apos;ll review your payment details before the order is placed.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
