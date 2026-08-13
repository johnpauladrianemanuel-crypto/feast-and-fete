'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type PaymentMethod = 'cash_on_delivery' | 'card' | 'bank_transfer' | 'gcash';
type DeliveryMethod = 'delivery' | 'pickup';

interface AddressForm {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  region?: string;
  city: string;
  barangay?: string;
  notes: string;
  eventDate: string;
  eventTime: string;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { value: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives' },
  { value: 'gcash', label: 'GCash', icon: '📱', desc: 'Pay via GCash mobile wallet' },
  { value: 'card', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, or any major card' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', desc: 'BDO / BPI / UnionBank' },
];

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

export default function CustomerReviewPaymentContent() {
  const { state, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [form, setForm] = useState<AddressForm>({
    fullName: '',
    phone: '',
    email: '',
    street: '',
    region: 'NCR',
    city: '',
    barangay: '',
    notes: '',
    eventDate: '',
    eventTime: '',
  });
  const [errors, setErrors] = useState<Partial<AddressForm>>({});
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [guestProfile, setGuestProfile] = useState<{ id: string; contactType: string; contactValue: string } | null>(null);
  const [savedAddress, setSavedAddress] = useState('');

  const deliveryFee = deliveryMethod === 'delivery' ? 150 : 0;
  const total = totalAmount + deliveryFee;
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0);

  // Load profile data
  useEffect(() => {
    const gp = getGuestProfile();
    setGuestProfile(gp);
    if (gp && !user) {
      setForm(prev => ({
        ...prev,
        email: gp.contactType === 'email' ? gp.contactValue : prev.email,
        phone: gp.contactType === 'phone' ? gp.contactValue : prev.phone,
      }));
    }
  }, [user]);

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
          setSavedAddress(data.address || '');
          setForm(prev => ({
            ...prev,
            fullName: data.full_name || prev.fullName,
            email: data.email || user.email || prev.email,
            phone: data.phone || prev.phone,
            street: data.address || prev.street,
          }));
        } else {
          setForm(prev => ({ ...prev, email: user.email || prev.email }));
        }
      });
  }, [user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof AddressForm]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  const REGION_OPTIONS = [
    { value: 'NCR', label: 'National Capital Region (NCR)' },
    { value: 'CALABARZON', label: 'Calabarzon (Region IV-A)' },
    { value: 'CENTRAL_LUZON', label: 'Central Luzon (Region III)' },
  ];

  const REGION_CITY_MAP: Record<string, string[]> = {
    NCR: [
      'Quezon City',
      'Manila',
      'Makati',
      'Pasig',
      'Taguig',
      'Mandaluyong',
      'Parañaque',
      'Las Piñas',
      'Muntinlupa',
      'Marikina',
      'Caloocan',
      'Valenzuela',
      'Malabon',
      'Navotas',
      'San Juan',
      'Pasay'
    ],
    CALABARZON: [
      'San Mateo (Rizal)',
      'Antipolo City',
      'Taytay',
      'Cainta',
      'Rodriguez (Montalban)',
      'Bacoor City',
      'Imus City',
      'Dasmariñas City',
      'General Trias City',
      'Calamba City',
      'Santa Rosa City',
      'Biñan City',
      'Cabuyao City',
      'San Pedro City',
      'Lipa City',
      'Batangas City'
    ],
    CENTRAL_LUZON: [
      'Angeles City',
      'San Fernando City',
      'Mabalacat City',
      'Malolos City',
      'Meycauayan City',
      'San Jose del Monte City',
      'Tarlac City',
      'Olongapo City',
      'Cabanatuan City'
    ],
  };

  const CITY_BARANGAY_MAP: Record<string, string[]> = {
    // NCR Cities
    'Quezon City': ['Barangay San Jose', 'Barangay Holy Spirit', 'Barangay Tatalon', 'Batasan Hills', 'Commonwealth', 'Cubao', 'Diliman', 'Kamuning', 'Loyola Heights', 'New Manila', 'Novaliches', 'Project 6', 'Teachers Village'],
    'Manila': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco', 'Pandacan', 'Port Area', 'Quiapo', 'Sampaloc', 'San Miguel', 'San Nicolas', 'Santa Cruz', 'Santa Ana', 'Tondo'],
    'Makati': ['Poblacion', 'San Antonio', 'Bel-Air', 'Dasmariñas', 'Forbes Park', 'Guadalupe Nuevo', 'Guadalupe Viejo', 'Magallanes', 'Pio del Pilar', 'San Lorenzo', 'Urdaneta'],
    'Pasig': ['Bagong Ilog', 'Pinagbuhatan', 'Caniogan', 'Kapitolyo', 'Manggahan', 'Maybunga', 'Oranbo', 'Rosario', 'San Antonio', 'San Joaquin', 'Ugong'],
    'Taguig': ['Central Bicutan', 'Ususan', 'Bambang', 'Fort Bonifacio (BGC)', 'Lower Bicutan', 'Napindan', 'Pinagsama', 'Signal Village', 'Tuktukan', 'Upper Bicutan'],
    'Mandaluyong': ['Addition Hills', 'Barangka Drive', 'Highway Hills', 'Hulo', 'Malamig', 'Plainview', 'Pleasant Hills', 'Poblacion', 'San Jose', 'Wack-Wack Greenhills'],
    'Parañaque': ['B F Homes', 'Don Bosco', 'Baclaran', 'Don Galo', 'La Huerta', 'Moonwalk', 'San Dionisio', 'San Isidro', 'Santo Niño', 'Sun Valley', 'Tambo'],
    'Las Piñas': ['Alabang-Zapote', 'BF International', 'Daniel Fajardo', 'Pamplona Uno', 'Pamplona Tres', 'Pilar', 'Pulang Lupa Uno', 'Talon Uno', 'Talon Dos'],
    'Muntinlupa': ['Alabang', 'Bayanan', 'B declaration', 'Cupang', 'Poblacion', 'Putatan', 'Sucat', 'Tunasan'],
    'Marikina': ['Barangka', 'Concepcion Uno', 'Concepcion Dos', 'Industrial Valley', 'Fortune', 'Malanday', 'Marikina Heights', 'Nangka', 'Parang', 'San Roque', 'Santa Elena'],
    'Caloocan': ['Barangay 1 to 188 (North/South Caloocan)', 'Bagong Silang', 'Camarin', 'Deparo', 'Grace Park', 'Monumento', 'Tala'],
    'Valenzuela': ['Arkong Bato', 'Gen. T. de Leon', 'Karuhatan', 'Lawang Bato', 'Malinta', 'Mapulang Lupa', 'Marulas', 'Paso de Blas', 'Poblacion', 'Punturin'],
    'Malabon': ['Acacia', 'Catmon', 'Concepcion', 'Dampalit', 'Longos', 'Niugan', 'Potrero', 'San Agustin', 'Tañong', 'Tugatog'],
    'Navotas': ['Bagumbayan North', 'Bagumbayan South', 'Bangkulasi', 'Daanghari', 'Navotas East', 'Navotas West', 'San Jose', 'San Roque', 'Tangos North', 'Tangos South'],
    'San Juan': ['Addition Hills', 'Balong-Bato', 'Greenhills', 'Kabayanan', 'Little Baguio', 'Maytunas', 'Onse', 'Pasadena', 'Poblacion', 'Progreso', 'San Perfecta', 'Tibagan'],
    'Pasay': ['Baclaran', 'Don Carlos Village', 'Malibay', 'Maricaban', 'Poblacion', 'San Jose', 'San Rafael', 'San Roque', 'Villamor Airbase'],

    // CALABARZON Cities / Municipalities
    'San Mateo (Rizal)': [
      'Ampid I',
      'Ampid II',
      'Banaba',
      'Dulumbayan',
      'Guitnang Bayan I',
      'Guitnang Bayan II',
      'Gulod Malaya',
      'Malanday',
      'Maly',
      'Pintong Bukawe',
      'Santa Ana',
      'Santo Niño',
      'Silangan',
      'Kambal'
    ],
    'Antipolo City': ['Bagong Nayon', 'Beverly Hills', 'Calawis', 'Cupang', 'Dalig', 'Inarawan', 'Mambugan', 'Mayamot', 'Muntingdilaw', 'San Cruz', 'San Isidro', 'San Jose', 'San Roque'],
    'Taytay': ['Dolores (Poblacion)', 'Muzon', 'San Juan', 'San Isidro', 'Santa Ana'],
    'Cainta': ['San Andres', 'San Juan', 'San Roque', 'Santa Rosa', 'Santo Domingo'],
    'Rodriguez (Montalban)': ['Balite', 'Burgos', 'Geronimo', 'Macabud', 'Manggahan', 'Mascap', 'Rosario', 'San Jose', 'San Rafael'],
    'Bacoor City': ['Bayanan', 'Habay I', 'Habay II', 'Mambog I', 'Mambog II', 'Molino I', 'Molino II', 'Molino III', 'Molino IV', 'Niog I', 'Niog II', 'Panapaan', 'Salawag', 'Talaba'],
    'Imus City': ['Anabu I-A', 'Anabu II-A', 'Bucandala', 'Carsadang Bago', 'Malagasang I-A', 'Malagasang II-A', 'Medicion', 'Poblacion', 'Tanzang Luma'],
    'Dasmariñas City': ['Burol', 'Dasmariñas Bagong Bayan', 'Langkaan I', 'Langkaan II', 'Paliparan I', 'Paliparan II', 'Paliparan III', 'Sabang', 'Salawag', 'Salitran I', 'Salitran II', 'Sampaloc I'],
    'General Trias City': ['Arnaldo', 'Bacao', 'Manggahan', 'Navarro', 'Pasong Kawayan', 'San Francisco', 'Tejero'],
    'Calamba City': ['Barandal', 'Bucal', 'Canlubang', 'Halang', 'Lawa', 'Makiling', 'Parian', 'Poblacion', 'Real', 'Saimsim', 'Turbina'],
    'Santa Rosa City': ['Balibago', 'Dila', 'Dita', 'Don Jose', 'Ibaba', 'Macabling', 'Malitlit', 'Market Area', 'Sinalhan', 'Tagapo'],
    'Biñan City': ['Caniogan', 'De La Paz', 'Ganado', 'Langkiwa', 'Loma', 'Malaban', 'Platero', 'Poblacion', 'San Antonio', 'San Francisco', 'Santo Tomas'],
    'Cabuyao City': ['Banaybanay', 'Banlic', 'Bigaa', 'Casile', 'Diezmo', 'Gulod', 'Mamatid', 'Poblacion', 'Pulo', 'Sala'],
    'San Pedro City': ['Chrysanthemum', 'Cuyab', 'Landayan', 'Langgam', 'Magsaysay', 'Pacita 1', 'Pacita 2', 'Poblacion', 'San Antonio', 'San Vicente', 'United Bayanihan'],
    'Lipa City': ['Balintawak', 'Inosloban', 'Mataas na Lupa', 'Pangao', 'Poblacion', 'Sabang', 'San Carlos', 'Tambobong', 'Tibig'],
    'Batangas City': ['Alangilan', 'Balagtas', 'Bolbok', 'Calicanto', 'Cuta', 'Gulod Labac', 'Kumintang Ibaba', 'Kumintang Ilaya', 'Poblacion', 'Soro-soro Karsada'],

    // CENTRAL LUZON Cities
    'Angeles City': ['Balibago', 'Cutcut', 'Malabanias', 'Margardt', 'Pami', 'Pulung Maragul', 'Salapungan', 'Santo Rosario', 'Sapu Bato'],
    'San Fernando City': ['Calulut', 'Dolores', 'Lacing', 'Magliman', 'Maimpis', 'Palawe', 'San Agustin', 'San Jose', 'Sindalan', 'Telabastagan'],
    'Mabalacat City': ['Dau', 'Lakandula', 'Mabiga', 'Macapagal Village', 'Poblacion', 'San Francisco', 'Santa Ines', 'Tabun'],
    'Malolos City': ['Bulihan', 'Cofradia', 'Guinhawa', 'Ligas', 'Longos', 'Lugam', 'Mojon', 'Panasahan', 'San Gabriel', 'San Vicente'],
    'Meycauayan City': ['Banga', 'Bayugo', 'Calvario', 'Iba', 'Lawa', 'Libtong', 'Perez', 'Poblacion', 'Saluysoy', 'Zamora'],
    'San Jose del Monte City': ['Fierce', 'Gumaoc', 'Muzon', 'Poblacion', 'Graceville', 'Kaypian', 'San Manuel', 'Santo Cristo', 'Tungkong Mangga'],
    'Tarlac City': ['Binauganan', 'Central', 'Matatalaib', 'Poblacion', 'San Nicolas', 'San Rafael', 'San Vicente', 'Sepung Calzada', 'Suizo', 'Tibag'],
    'Olongapo City': ['Barretto', 'East Bajac-Bajac', 'East Tapinac', 'Gordon Heights', 'Kalaklan', 'New Cabalan', 'Old Cabalan', 'Santa Rita', 'West Bajac-Bajac', 'West Tapinac'],
    'Cabanatuan City': ['Bitas', 'Cabanatuan', 'Mabini Extension', 'Sangitan', 'San Josef', 'Supermarket', 'Aduas Norte', 'Aduas Sur', 'Barangay 1-10'],
  };

  function validate(): boolean {
    const errs: Partial<AddressForm> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (deliveryMethod === 'delivery' && !form.street.trim()) errs.street = 'Street address is required';
    if (!form.eventDate) errs.eventDate = 'Event date is required';
    if (!form.eventTime) errs.eventTime = 'Event time is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setPlacing(true);
    setPlaceError('');

    const deliveryAddress = deliveryMethod === 'delivery'
      ? `${form.street}${form.barangay ? ', ' + form.barangay : ''}${form.city ? ', ' + form.city : ''}${form.region ? ', ' + form.region : ''}`
      : 'Pickup at Feast & Fête Kitchen';

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
          payment_method: paymentMethod,
          notes: form.notes,
          subtotal: totalAmount,
          delivery_fee: deliveryFee,
          total_amount: total,
          status: 'Pending',
        })
        .select('id')
        .single();

      if (orderError) {
        setPlaceError('Failed to place order: ' + orderError.message);
        setPlacing(false);
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
      console.error('Order error:', err);
      setPlaceError('Something went wrong. Please try again.');
      setPlacing(false);
      return;
    }

    const orderPayload = {
      orderId,
      customerName: form.fullName,
      email: form.email,
      phone: form.phone,
      deliveryMethod,
      address: deliveryAddress,
      eventDate: form.eventDate,
      eventTime: form.eventTime,
      paymentMethod,
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
    router.push('/order-confirmation');
  }

  // Empty cart state
  if (state.items.length === 0 && !placing) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNavbar />
        <CartDrawer />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Icon name="ShoppingCartIcon" size={36} className="text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add items to your cart before reviewing your order.</p>
          <Link href="/menu-browse-screen" className="px-6 py-3 gradient-brand text-primary-foreground font-semibold rounded-xl btn-3d">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />

      <div className="max-w-6xl mx-auto px-4 py-10 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
          <Link href="/menu-browse-screen" className="hover:text-primary transition-colors">Menu</Link>
          <Icon name="ChevronRightIcon" size={14} />
          <Link href="/cart-review" className="hover:text-primary transition-colors">Cart</Link>
          <Icon name="ChevronRightIcon" size={14} />
          <span className="text-foreground font-medium">Review & Payment</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Review & Payment</h1>
          <p className="text-muted-foreground">Confirm your items, enter delivery details, and place your order.</p>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Order Items */}
              <section
                className="bg-card rounded-2xl border border-border p-6"
                style={{ boxShadow: 'var(--shadow-3d)' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full gradient-brand text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
                    Confirm Items
                  </h2>
                  <Link href="/cart-review" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                    <Icon name="PencilIcon" size={12} />
                    Edit Cart
                  </Link>
                </div>

                <div className="space-y-3">
                  {state.items.map(item => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        <AppImage
                          src={item.menuItem.image}
                          alt={item.menuItem.imageAlt}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">{item.menuItem.servingSize}</p>
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(item.customizations).map(([k, v]) => (
                              <span key={k} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{v}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">₱{(item.menuItem.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Delivery Method */}
              <section
                className="bg-card rounded-2xl border border-border p-6"
                style={{ boxShadow: 'var(--shadow-3d)' }}
              >
                <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2 mb-5">
                  <span className="w-6 h-6 rounded-full gradient-brand text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
                  Delivery Method
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {(['delivery', 'pickup'] as DeliveryMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setDeliveryMethod(method)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        deliveryMethod === method
                          ? 'border-primary bg-primary/5' :'border-border bg-background hover:border-primary/40'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        deliveryMethod === method ? 'gradient-brand' : 'bg-muted'
                      }`}>
                        <Icon
                          name={method === 'delivery' ? 'TruckIcon' : 'BuildingStorefrontIcon'}
                          size={18}
                          className={deliveryMethod === method ? 'text-primary-foreground' : 'text-muted-foreground'}
                        />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold capitalize ${deliveryMethod === method ? 'text-primary' : 'text-foreground'}`}>
                          {method === 'delivery' ? 'Delivery' : 'Pickup'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {method === 'delivery' ? '+₱150 fee' : 'Free · At our kitchen'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Address Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name <span className="text-error">*</span></label>
                      <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Juan dela Cruz"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.fullName ? 'border-error' : 'border-border'}`}
                      />
                      {errors.fullName && <p className="text-xs text-error mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number <span className="text-error">*</span></label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="09XX XXX XXXX"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.phone ? 'border-error' : 'border-border'}`}
                      />
                      {errors.phone && <p className="text-xs text-error mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address <span className="text-error">*</span></label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="juan@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.email ? 'border-error' : 'border-border'}`}
                    />
                    {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
                  </div>

                  {deliveryMethod === 'delivery' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1.5">Region</label>
                          <select
                            name="region"
                            value={form.region}
                            onChange={e => {
                              // reset city and barangay when region changes
                              setForm(prev => ({ ...prev, region: e.target.value, city: '', barangay: '' }));
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                          >
                            {REGION_OPTIONS.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1.5">City / Municipality</label>
                          <select
                            name="city"
                            value={form.city}
                            onChange={e => setForm(prev => ({ ...prev, city: e.target.value, barangay: '' }))}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                          >
                            <option value="">Select city</option>
                            {(REGION_CITY_MAP[form.region || 'NCR'] || []).map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1.5">Barangay</label>
                          <select
                            name="barangay"
                            value={form.barangay}
                            onChange={e => setForm(prev => ({ ...prev, barangay: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                          >
                            <option value="">Select barangay</option>
                            {((CITY_BARANGAY_MAP as Record<string, string[]>)[form.city] || []).map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-foreground">Street Address <span className="text-error">*</span></label>
                          {savedAddress && (
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, street: savedAddress }))}
                              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                            >
                              <Icon name="BookmarkIcon" size={11} />
                              Use saved
                            </button>
                          )}
                        </div>
                        <input
                          name="street"
                          value={form.street}
                          onChange={handleChange}
                          placeholder="123 Rizal St., House / Unit No."
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.street ? 'border-error' : 'border-border'}`}
                        />
                        {errors.street && <p className="text-xs text-error mt-1">{errors.street}</p>}
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Event Date <span className="text-error">*</span></label>
                      <input
                        name="eventDate"
                        type="date"
                        value={form.eventDate}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.eventDate ? 'border-error' : 'border-border'}`}
                      />
                      {errors.eventDate && <p className="text-xs text-error mt-1">{errors.eventDate}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Event Time <span className="text-error">*</span></label>
                      <input
                        name="eventTime"
                        type="time"
                        value={form.eventTime}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.eventTime ? 'border-error' : 'border-border'}`}
                      />
                      {errors.eventTime && <p className="text-xs text-error mt-1">{errors.eventTime}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Special Instructions <span className="text-muted-foreground font-normal">(optional)</span></label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Allergies, special requests, gate code..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section
                className="bg-card rounded-2xl border border-border p-6"
                style={{ boxShadow: 'var(--shadow-3d)' }}
              >
                <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2 mb-5">
                  <span className="w-6 h-6 rounded-full gradient-brand text-primary-foreground text-xs font-bold flex items-center justify-center">3</span>
                  Payment Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAYMENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === opt.value
                          ? 'border-primary bg-primary/5' :'border-border bg-background hover:border-primary/40'
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${paymentMethod === opt.value ? 'text-primary' : 'text-foreground'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{opt.desc}</p>
                      </div>
                      {paymentMethod === opt.value && (
                        <div className="ml-auto w-5 h-5 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
                          <Icon name="CheckIcon" size={11} className="text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Icon name="InformationCircleIcon" size={14} className="text-primary" />
                      Bank Transfer Details
                    </p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>BDO: <span className="font-mono text-foreground">0012-3456-7890</span></p>
                      <p>BPI: <span className="font-mono text-foreground">1234-5678-90</span></p>
                      <p>Account Name: <span className="text-foreground font-medium">Feast & Fête Catering</span></p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'gcash' && (
                  <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                      <Icon name="InformationCircleIcon" size={14} className="text-primary" />
                      GCash Number
                    </p>
                    <p className="text-xs text-muted-foreground">Send to: <span className="font-mono text-foreground font-semibold">0917-XXX-XXXX</span> · Feast & Fête</p>
                  </div>
                )}
              </section>
            </div>

            {/* ── RIGHT COLUMN — Order Summary ── */}
            <div className="lg:col-span-2">
              <div
                className="bg-card rounded-2xl border border-border p-6 sticky top-24"
                style={{ boxShadow: 'var(--shadow-3d)' }}
              >
                <h2 className="font-display text-base font-bold text-foreground mb-5">Order Summary</h2>

                {/* Items mini-list */}
                <div className="space-y-2 mb-5 max-h-48 overflow-y-auto pr-1">
                  {state.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-foreground truncate mr-2">
                        {item.menuItem.name}
                        <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                      </span>
                      <span className="font-semibold text-foreground tabular-nums flex-shrink-0">
                        ₱{(item.menuItem.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-4 space-y-2.5 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="text-foreground tabular-nums">₱{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery fee</span>
                    <span className="text-foreground tabular-nums">
                      {deliveryFee === 0 ? <span className="text-green-600 font-medium">Free</span> : `₱${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary tabular-nums text-lg">₱{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Selected payment badge */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted mb-5">
                  <span className="text-lg">{PAYMENT_OPTIONS.find(p => p.value === paymentMethod)?.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Payment via</p>
                    <p className="text-sm font-semibold text-foreground truncate">{PAYMENT_OPTIONS.find(p => p.value === paymentMethod)?.label}</p>
                  </div>
                </div>

                {placeError && (
                  <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <Icon name="ExclamationCircleIcon" size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{placeError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={placing}
                  className="w-full py-4 gradient-brand text-primary-foreground font-bold text-base rounded-2xl btn-3d transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {placing ? (
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
                      Place Order · ₱{total.toLocaleString()}
                    </>
                  )}
                </button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  By placing your order, you agree to our terms and conditions.
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}