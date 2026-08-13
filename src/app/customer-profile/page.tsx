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

function CustomerProfileContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '', preferences: '' });
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
        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          preferences: data.preferences || '',
        });
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
      // Fetch stats
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const { error: updateErr } = await supabase
        .from('user_profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);
      if (updateErr) throw updateErr;
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
    await supabase
      .from('user_profiles')
      .update({ full_name: form.full_name, phone: form.phone, address: form.address, preferences: form.preferences })
      .eq('id', user.id);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeftIcon" size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Account</h1>
            <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
          </div>
        </div>

        {/* Avatar + Verified Contact */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div
              className="w-24 h-24 rounded-full overflow-hidden cursor-pointer ring-4 ring-border hover:ring-primary/50 transition-all shadow-lg"
              onClick={handleAvatarClick}
              title="Change profile picture"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile picture"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full gradient-brand flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="CameraIcon" size={22} className="text-white" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {/* Contact Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground mb-1">{form.full_name || 'Your Name'}</h2>
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploading}
              className="text-xs text-primary hover:underline disabled:opacity-50 transition-colors mb-3 block"
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            {uploadError && (
              <p className="text-xs text-red-500 mb-2">{uploadError}</p>
            )}

            {/* Verified Email */}
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <Icon name="EnvelopeIcon" size={15} className="text-muted-foreground" />
              <span className="text-sm text-foreground">{user?.email}</span>
              {isEmailVerified ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  <Icon name="CheckBadgeIcon" size={12} className="text-green-600" />
                  Verified
                </span>
              ) : (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Unverified</span>
              )}
            </div>

            {/* Phone if set */}
            {form.phone && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Icon name="PhoneIcon" size={15} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{form.phone}</span>
              </div>
            )}

            {profile?.role === 'admin' && (
              <span className="mt-2 inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">Admin</span>
            )}
          </div>
        </div>

        {/* Order History Summary */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Icon name="ClipboardDocumentListIcon" size={18} className="text-primary" />
              Order History
            </h3>
            <Link href="/customer-orders" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              View All
              <Icon name="ArrowRightIcon" size={12} />
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{orderStats.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Orders</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{orderStats.completed}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">₱{orderStats.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Spent</p>
            </div>
          </div>

          {/* Recent Orders */}
          {ordersLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-6">
              <Icon name="ShoppingBagIcon" size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No orders yet. Start ordering!</p>
              <Link href="/menu-browse-screen" className="mt-3 inline-block text-sm text-primary hover:underline font-medium">
                Browse Menu →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <Link
                  key={order.id}
                  href={`/order-status?order=${order.order_number}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="ReceiptPercentIcon" size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">#{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status] || 'bg-muted text-muted-foreground'}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-foreground">₱{order.total_amount?.toLocaleString()}</span>
                    <Icon name="ChevronRightIcon" size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Editable Profile Form */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
            <Icon name="PencilSquareIcon" size={18} className="text-primary" />
            Edit Profile
          </h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-muted-foreground cursor-not-allowed pr-24"
                />
                {isEmailVerified && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium text-green-600">
                    <Icon name="CheckBadgeIcon" size={14} className="text-green-600" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Delivery Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                placeholder="Enter your default delivery address"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Dietary Preferences
                <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                name="preferences"
                value={form.preferences}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. No pork, vegetarian, allergic to shellfish…"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">We'll note your preferences when preparing your orders.</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <Icon name="CheckCircleIcon" size={18} />
                  Saved!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/customer-orders"
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-muted transition-colors"
          >
            <Icon name="ClipboardDocumentListIcon" size={20} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Order History</span>
          </Link>
          <Link
            href="/customer-notifications"
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-muted transition-colors"
          >
            <Icon name="BellIcon" size={20} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Notifications</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CustomerProfilePage() {
  return <CustomerProfileContent />;
}