'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import Image from 'next/image';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  preferences?: string;
}

interface OrderSummary {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_method: string;
}

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  Confirmed: 'bg-blue-100 text-blue-700 border border-blue-200',
  Preparing: 'bg-orange-100 text-orange-700 border border-orange-200',
  Ready: 'bg-primary/10 text-primary border border-primary/20',
  Completed: 'bg-green-100 text-green-700 border border-green-200',
  Cancelled: 'bg-red-100 text-red-700 border border-red-200',
};

const REGION_OPTIONS = [
  { value: 'NCR', label: 'National Capital Region (NCR)' },
  { value: 'CALABARZON', label: 'Calabarzon (Region IV-A)' },
  { value: 'CENTRAL_LUZON', label: 'Central Luzon (Region III)' },
];

const REGION_CITY_MAP: Record<string, string[]> = {
  NCR: [
    'Quezon City', 'Manila', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong',
    'Parañaque', 'Las Piñas', 'Muntinlupa', 'Marikina', 'Caloocan',
    'Valenzuela', 'Malabon', 'Navotas', 'San Juan', 'Pasay'
  ],
  CALABARZON: [
    'San Mateo (Rizal)', 'Antipolo City', 'Taytay', 'Cainta', 'Rodriguez (Montalban)',
    'Bacoor City', 'Imus City', 'Dasmariñas City', 'General Trias City',
    'Calamba City', 'Santa Rosa City', 'Biñan City', 'Cabuyao City',
    'San Pedro City', 'Lipa City', 'Batangas City'
  ],
  CENTRAL_LUZON: [
    'Angeles City', 'San Fernando City', 'Mabalacat City', 'Malolos City',
    'Meycauayan City', 'San Jose del Monte City', 'Tarlac City',
    'Olongapo City', 'Cabanatuan City'
  ],
};

const CITY_BARANGAY_MAP: Record<string, string[]> = {
  'Quezon City': ['Barangay San Jose', 'Barangay Holy Spirit', 'Barangay Tatalon', 'Batasan Hills', 'Commonwealth', 'Cubao', 'Diliman', 'Kamuning', 'Loyola Heights', 'New Manila', 'Novaliches', 'Project 6', 'Teachers Village'],
  'Manila': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco', 'Pandacan', 'Port Area', 'Quiapo', 'Sampaloc', 'San Miguel', 'San Nicolas', 'Santa Cruz', 'Santa Ana', 'Tondo'],
  'Makati': ['Poblacion', 'San Antonio', 'Bel-Air', 'Dasmariñas', 'Forbes Park', 'Guadalupe Nuevo', 'Guadalupe Viejo', 'Magallanes', 'Pio del Pilar', 'San Lorenzo', 'Urdaneta'],
  'Pasig': ['Bagong Ilog', 'Pinagbuhatan', 'Caniogan', 'Kapitolyo', 'Manggahan', 'Maybunga', 'Oranbo', 'Rosario', 'San Antonio', 'San Joaquin', 'Ugong'],
  'Taguig': ['Central Bicutan', 'Ususan', 'Bambang', 'Fort Bonifacio (BGC)', 'Lower Bicutan', 'Napindan', 'Pinagsama', 'Signal Village', 'Tuktukan', 'Upper Bicutan'],
  'Mandaluyong': ['Addition Hills', 'Barangka Drive', 'Highway Hills', 'Hulo', 'Malamig', 'Plainview', 'Pleasant Hills', 'Poblacion', 'San Jose', 'Wack-Wack Greenhills'],
  'Parañaque': ['B F Homes', 'Don Bosco', 'Baclaran', 'Don Galo', 'La Huerta', 'Moonwalk', 'San Dionisio', 'San Isidro', 'Santo Niño', 'Sun Valley', 'Tambo'],
  'Las Piñas': ['Alabang-Zapote', 'BF International', 'Daniel Fajardo', 'Pamplona Uno', 'Pamplona Tres', 'Pilar', 'Pulang Lupa Uno', 'Talon Uno', 'Talon Dos'],
  'Muntinlupa': ['Alabang', 'Bayanan', 'Cupang', 'Poblacion', 'Putatan', 'Sucat', 'Tunasan'],
  'Marikina': ['Barangka', 'Concepcion Uno', 'Concepcion Dos', 'Industrial Valley', 'Fortune', 'Malanday', 'Marikina Heights', 'Nangka', 'Parang', 'San Roque', 'Santa Elena'],
  'Caloocan': ['Barangay 1 to 188 (North/South Caloocan)', 'Bagong Silang', 'Camarin', 'Deparo', 'Grace Park', 'Monumento', 'Tala'],
  'Valenzuela': ['Arkong Bato', 'Gen. T. de Leon', 'Karuhatan', 'Lawang Bato', 'Malinta', 'Mapulang Lupa', 'Marulas', 'Paso de Blas', 'Poblacion', 'Punturin'],
  'Malabon': ['Acacia', 'Catmon', 'Concepcion', 'Dampalit', 'Longos', 'Niugan', 'Potrero', 'San Agustin', 'Tañong', 'Tugatog'],
  'Navotas': ['Bagumbayan North', 'Bagumbayan South', 'Bangkulasi', 'Daanghari', 'Navotas East', 'Navotas West', 'San Jose', 'San Roque', 'Tangos North', 'Tangos South'],
  'San Juan': ['Addition Hills', 'Balong-Bato', 'Greenhills', 'Kabayanan', 'Little Baguio', 'Maytunas', 'Onse', 'Pasadena', 'Poblacion', 'Progreso', 'San Perfecta', 'Tibagan'],
  'Pasay': ['Baclaran', 'Don Carlos Village', 'Malibay', 'Maricaban', 'Poblacion', 'San Jose', 'San Rafael', 'San Roque', 'Villamor Airbase'],
  'San Mateo (Rizal)': ['Ampid I', 'Ampid II', 'Banaba', 'Dulumbayan', 'Guitnang Bayan I', 'Guitnang Bayan II', 'Gulod Malaya', 'Malanday', 'Maly', 'Pintong Bukawe', 'Santa Ana', 'Santo Niño', 'Silangan', 'Kambal'],
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

function CustomerProfileContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ 
    full_name: '', 
    phone: '', 
    region: 'NCR',
    city: '',
    barangay: '',
    street: '',
    preferences: '' 
  });
  
  // Multiple addresses state
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({ region: 'NCR', city: '', barangay: '', street: '' });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStats, setOrderStats] = useState({ total: 0, completed: 0, pending: 0, totalSpent: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-up-login-screen');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setProfileLoading(true);
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data);
        setAvatarUrl(data.avatar_url || null);
        
        // Parse address if it follows comma-separated format
        const addrParts = (data.address || '').split(',').map((s: string) => s.trim());
        const street = addrParts[0] || '';
        const barangay = addrParts[1] || '';
        const city = addrParts[2] || '';
        const region = addrParts[3] || 'NCR';

        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          region: region,
          city: city,
          barangay: barangay,
          street: street,
          preferences: data.preferences || '',
        });

        // Load multiple addresses if stored as JSON array or fallback to single address
        if (data.additional_addresses && Array.isArray(data.additional_addresses)) {
          setSavedAddresses(data.additional_addresses);
        } else if (data.address) {
          setSavedAddresses([data.address]);
        }
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, delivery_method')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) {
        setRecentOrders(data as OrderSummary[]);
      }
      const { data: allOrders } = await supabase
        .from('orders')
        .select('status, total_amount')
        .eq('user_id', user.id);
      if (allOrders) {
        const completed = allOrders.filter(o => o.status === 'Completed').length;
        const pending = allOrders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length;
        const totalSpent = allOrders
          .filter(o => o.status === 'Completed')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);
        setOrderStats({ total: allOrders.length, completed, pending, totalSpent });
      }
      setOrdersLoading(false);
    };
    fetchOrders();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadError(null);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB.');
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
      await supabase
        .from('user_profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);
      setAvatarUrl(publicUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const fullAddress = `${form.street}, ${form.barangay}, ${form.city}, ${form.region}`;
    
    await supabase
      .from('user_profiles')
      .update({ 
        full_name: form.full_name, 
        phone: form.phone, 
        address: fullAddress, 
        preferences: form.preferences,
        additional_addresses: savedAddresses 
      })
      .eq('id', user.id);
      
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const newAddr = `${newAddressForm.street}, ${newAddressForm.barangay}, ${newAddressForm.city}, ${newAddressForm.region}`;
    const updatedAddresses = [...savedAddresses, newAddr];
    setSavedAddresses(updatedAddresses);

    await supabase
      .from('user_profiles')
      .update({ additional_addresses: updatedAddresses })
      .eq('id', user.id);

    setShowAddAddressModal(false);
    setNewAddressForm({ region: 'NCR', city: '', barangay: '', street: '' });
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = (form.full_name || user?.email || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isEmailVerified = !!user?.email_confirmed_at;

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeftIcon" size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Account</h1>
            <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
          </div>
        </div>

        {/* Avatar Card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group flex-shrink-0">
            <div
              className="w-24 h-24 rounded-full overflow-hidden cursor-pointer ring-4 ring-border hover:ring-primary/50 transition-all shadow-lg"
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Profile picture" width={96} height={96} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full gradient-brand flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground mb-1">{form.full_name || 'Your Name'}</h2>
            <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Icon name="PencilSquareIcon" size={18} className="text-primary" />
              Edit Profile & Main Address
            </h3>
            <button
              type="button"
              onClick={() => setShowAddAddressModal(true)}
              className="px-3 py-1.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold flex items-center gap-1 btn-3d"
            >
              <Icon name="PlusIcon" size={14} />
              + Add Address
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input type="text" name="full_name" value={form.full_name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground" />
            </div>

            {/* Structured Address */}
            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
              <label className="block text-sm font-semibold text-foreground">Default Delivery Address</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Region</label>
                  <select name="region" value={form.region} onChange={handleChange} className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-background text-foreground">
                    {REGION_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">City</label>
                  <select name="city" value={form.city} onChange={handleChange} className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-background text-foreground">
                    <option value="">Select city</option>
                    {(REGION_CITY_MAP[form.region] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Barangay</label>
                  <select name="barangay" value={form.barangay} onChange={handleChange} className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-background text-foreground">
                    <option value="">Select barangay</option>
                    {(CITY_BARANGAY_MAP[form.city] || []).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Street Address / Unit No.</label>
                <input type="text" name="street" value={form.street} onChange={handleChange} className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-background text-foreground" />
              </div>
            </div>

            {/* Saved Addresses List */}
            {savedAddresses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Saved Delivery Locations</label>
                <div className="space-y-2">
                  {savedAddresses.map((addr, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/40 text-xs">
                      <span className="text-foreground">{addr}</span>
                      <button
                        type="button"
                        onClick={() => setForm(prev => {
                          const parts = addr.split(',').map(s => s.trim());
                          return { ...prev, street: parts[0] || '', barangay: parts[1] || '', city: parts[2] || '', region: parts[3] || 'NCR' };
                        })}
                        className="text-primary font-semibold hover:underline"
                      >
                        Set as Default
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 py-2.5 gradient-brand text-white font-semibold rounded-xl transition">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saveSuccess && <span className="text-sm text-green-600 font-medium">Saved!</span>}
            </div>
          </form>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground mb-4">Add New Delivery Address</h3>
            <form onSubmit={handleAddAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Region</label>
                <select 
                  value={newAddressForm.region} 
                  onChange={e => setNewAddressForm(p => ({ ...p, region: e.target.value, city: '', barangay: '' }))}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-background text-foreground"
                >
                  {REGION_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">City / Municipality</label>
                <select 
                  value={newAddressForm.city} 
                  onChange={e => setNewAddressForm(p => ({ ...p, city: e.target.value, barangay: '' }))}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-background text-foreground"
                >
                  <option value="">Select city</option>
                  {(REGION_CITY_MAP[newAddressForm.region] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Barangay</label>
                <select 
                  value={newAddressForm.barangay} 
                  onChange={e => setNewAddressForm(p => ({ ...p, barangay: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-background text-foreground"
                >
                  <option value="">Select barangay</option>
                  {(CITY_BARANGAY_MAP[newAddressForm.city] || []).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Street Address</label>
                <input 
                  type="text" 
                  value={newAddressForm.street} 
                  onChange={e => setNewAddressForm(p => ({ ...p, street: e.target.value }))}
                  placeholder="Street / Unit No." 
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs bg-background text-foreground"
                  required 
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setShowAddAddressModal(false)} className="w-1/2 py-2.5 rounded-xl border border-border text-sm">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl gradient-brand text-primary-foreground text-sm font-bold">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerProfilePage() {
  return <CustomerProfileContent />;
}