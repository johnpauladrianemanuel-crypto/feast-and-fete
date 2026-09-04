import { createClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockStatus = 'OK' | 'Low Stock' | 'Out of Stock';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  price: number;
  servingSize: string;
  image: string;
  imageAlt: string;
  isActive: boolean;
  unavailableReason?: string;
  stock: number;
  soldCount: number;
  featured: boolean;
  customizations?: MenuCustomization[];
}

export interface MenuCustomizationOption {
  value: string;
  label: string;
}

export interface MenuCustomization {
  id: string;
  label: string;
  options: MenuCustomizationOption[];
  defaultValue: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  status: StockStatus;
  lastUpdated: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface AdminNotification {
  id: string;
  type: 'order' | 'payment' | 'inventory' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ─── Row → App type mappers ───────────────────────────────────────────────────

function rowToMenuItem(row: Record<string, unknown>): MenuItem {
  const rawActive = row.is_active ?? row.isActive;
  
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    categorySlug: row.category_slug as string,
    description: row.description as string,
    price: Number(row.price),
    servingSize: (row.serving_size as string) || (row.servingSize as string) || '',
    image: row.image as string,
    imageAlt: row.image_alt as string,
    isActive: rawActive !== undefined && rawActive !== null ? Boolean(rawActive) : true,
    unavailableReason: (row.unavailable_reason as string) || (row.unavailableReason as string) || '',
    stock: Number(row.stock),
    soldCount: Number(row.sold_count),
    featured: Boolean(row.featured),
    customizations: row.customizations ? (row.customizations as MenuCustomization[]) : undefined,
  };
}

function rowToInventoryItem(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    unit: row.unit as string,
    currentStock: Number(row.current_stock),
    reorderLevel: Number(row.reorder_level),
    status: row.status as StockStatus,
    lastUpdated: row.last_updated as string,
  };
}

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    date: row.date as string,
    category: row.category as string,
    description: row.description as string,
    amount: Number(row.amount),
  };
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

/**
 * Fetch all menu items for public customer view (includes deactivated with reasons)
 */
export async function fetchMenuItems(): Promise<MenuItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('featured', { ascending: false })
    .order('sold_count', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(rowToMenuItem);
}

/**
 * Fetch all menu items for Admin view
 */
export async function fetchAdminMenuItems(): Promise<MenuItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('featured', { ascending: false })
    .order('sold_count', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(rowToMenuItem);
}

export async function fetchFeaturedMenuItems(limit = 4): Promise<MenuItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('featured', true)
    .order('sold_count', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []).map(rowToMenuItem);
}

export async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('category, category_slug');
  if (error) throw new Error(error.message);

  const ICONS: Record<string, string> = {
    beef: '🥩',
    pork: '🐷',
    chicken: '🍗',
    seafood: '🦐',
    pasta: '🍝',
    vegetables: '🥦',
    desserts: '🍮',
    packages: '🎁',
    drinks: '🥤',
  };

  const map: Record<string, { name: string; slug: string; count: number }> = {};
  for (const row of (data || [])) {
    const slug = row.category_slug as string;
    if (!map[slug]) {
      map[slug] = { name: row.category as string, slug, count: 0 };
    }
    map[slug].count += 1;
  }

  return Object.entries(map).map(([slug, val]) => ({
    id: `cat-${slug}`,
    name: val.name,
    slug: val.slug,
    icon: ICONS[slug] || '🍽️',
    itemCount: val.count,
  }));
}

export async function updateMenuItem(
  id: string,
  updates: Partial<{
    name: string;
    price: number;
    stock: number;
    serving_size: string;
    servingSize: string;
    description: string;
    is_active: boolean;
    isActive: boolean;
    unavailable_reason: string | null;
    unavailableReason: string | null;
    deactivation_reason: string | null;
    deactivationReason: string | null;
    featured: boolean;
  }>
): Promise<void> {
  const supabase = createClient();

  // Normalize incoming fields to Database snake_case columns
  const payload: Record<string, unknown> = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.price !== undefined) payload.price = Number(updates.price);
  if (updates.stock !== undefined) payload.stock = Number(updates.stock);
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.featured !== undefined) payload.featured = Boolean(updates.featured);

  if (updates.serving_size !== undefined) {
    payload.serving_size = updates.serving_size;
  } else if (updates.servingSize !== undefined) {
    payload.serving_size = updates.servingSize;
  }

  if (updates.is_active !== undefined) {
    payload.is_active = Boolean(updates.is_active);
  } else if (updates.isActive !== undefined) {
    payload.is_active = Boolean(updates.isActive);
  }

  if (updates.unavailable_reason !== undefined) {
    payload.unavailable_reason = updates.unavailable_reason;
  } else if (updates.unavailableReason !== undefined) {
    payload.unavailable_reason = updates.unavailableReason;
  } else if (updates.deactivation_reason !== undefined) {
    payload.unavailable_reason = updates.deactivation_reason;
  } else if (updates.deactivationReason !== undefined) {
    payload.unavailable_reason = updates.deactivationReason;
  }

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from('menu_items').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return (data || []).map(rowToInventoryItem);
}

export async function updateInventoryItem(
  id: string,
  currentStock: number,
  reorderLevel: number
): Promise<void> {
  const supabase = createClient();
  let status: StockStatus = 'OK';
  if (currentStock === 0) status = 'Out of Stock';
  else if (currentStock <= reorderLevel) status = 'Low Stock';

  const { error } = await supabase
    .from('inventory_items')
    .update({
      current_stock: currentStock,
      reorder_level: reorderLevel,
      status,
      last_updated: new Date().toISOString().split('T')[0],
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function fetchExpenses(): Promise<Expense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(rowToExpense);
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToExpense(data as Record<string, unknown>);
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Admin Notifications ──────────────────────────────────────────────────────

export async function fetchAdminNotifications(): Promise<AdminNotification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as AdminNotification[];
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read: true })
    .eq('read', false);
  if (error) throw new Error(error.message);
}

export async function deleteAdminNotification(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Guest Profiles ───────────────────────────────────────────────────────────

export interface GuestProfile {
  id: string;
  contactType: 'phone' | 'email';
  contactValue: string;
  verifiedAt: string;
  createdAt: string;
}

export async function createGuestProfile(
  contactType: 'phone' | 'email',
  contactValue: string
): Promise<GuestProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('guest_profiles')
    .insert({
      contact_type: contactType,
      contact_value: contactValue.trim(),
      verified_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    contactType: row.contact_type as 'phone' | 'email',
    contactValue: row.contact_value as string,
    verifiedAt: row.verified_at as string,
    createdAt: row.created_at as string,
  };
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export interface DashboardKPIs {
  todayRevenue: number;
  todayOrderCount: number;
  todayDeliveryCount: number;
  todayPickupCount: number;
  pendingOrderCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const [ordersRes, inventoryRes] = await Promise.all([
    supabase
      .from('orders')
      .select('status, delivery_method, total_amount, created_at')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59.999Z`),
    supabase.from('inventory_items').select('status'),
  ]);

  const orders = ordersRes.data || [];
  const inventory = inventoryRes.data || [];

  const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
  const todayRevenue = activeOrders.reduce((s: number, o: Record<string, unknown>) => s + Number(o.total_amount), 0);
  const todayOrderCount = orders.length;
  const todayDeliveryCount = orders.filter((o: Record<string, unknown>) => o.delivery_method === 'delivery').length;
  const todayPickupCount = orders.filter((o: Record<string, unknown>) => o.delivery_method === 'pickup').length;

  const allPendingRes = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Pending');

  const pendingOrderCount = allPendingRes.count || 0;
  const lowStockCount = inventory.filter((i: Record<string, unknown>) => i.status === 'Low Stock' || i.status === 'Out of Stock').length;
  const outOfStockCount = inventory.filter((i: Record<string, unknown>) => i.status === 'Out of Stock').length;

  return {
    todayRevenue,
    todayOrderCount,
    todayDeliveryCount,
    todayPickupCount,
    pendingOrderCount,
    lowStockCount,
    outOfStockCount,
  };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface DailySalesData {
  date: string;
  revenue: number;
  orders: number;
}

export async function fetchSalesData(days: number): Promise<DailySalesData[]> {
  const supabase = createClient();
  const from = new Date();
  from.setDate(from.getDate() - days);

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total_amount, status')
    .gte('created_at', from.toISOString())
    .neq('status', 'Cancelled')
    .order('created_at');

  if (error) throw new Error(error.message);

  const map: Record<string, { revenue: number; orders: number }> = {};
  (data || []).forEach((o: Record<string, unknown>) => {
    const d = (o.created_at as string).split('T')[0];
    const [year, month, day] = d.split('-');
    const label = `${month}/${day}`;
    if (!map[label]) map[label] = { revenue: 0, orders: 0 };
    map[label].revenue += Number(o.total_amount);
    map[label].orders += 1;
  });

  return Object.entries(map).map(([date, v]) => ({ date, ...v }));
}

export async function fetchTopItems(): Promise<{ name: string; orders: number }[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('order_items')
    .select('menu_item_name, quantity');
  if (error) throw new Error(error.message);

  const map: Record<string, number> = {};
  (data || []).forEach((item: Record<string, unknown>) => {
    const name = item.menu_item_name as string;
    map[name] = (map[name] || 0) + Number(item.quantity);
  });

  return Object.entries(map)
    .map(([name, orders]) => ({ name, orders }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 8);
}

// ─── Customers ────────────────────────────────────────────────────────────────

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
}

export async function fetchCustomers(): Promise<CustomerRow[]> {
  const supabase = createClient();

  let { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, phone, address, created_at, role')
    .order('created_at', { ascending: false });

  if (error || !profiles || profiles.length === 0) {
    const { data: fallbackProfiles, error: fallbackError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, address, created_at')
      .order('created_at', { ascending: false });

    if (!fallbackError && fallbackProfiles && fallbackProfiles.length > 0) {
      profiles = fallbackProfiles.map((p) => ({ ...p, role: 'customer' }));
      error = null;
    }
  }

  if (error) throw new Error(error.message);
  if (!profiles || profiles.length === 0) return [];

  const customerProfiles = profiles.filter(
    (p: any) => !p.role || p.role === 'customer' || p.role !== 'admin'
  );

  const { data: orders } = await supabase
    .from('orders')
    .select('user_id, total_amount, status');

  const orderMap: Record<string, { count: number; spent: number }> = {};
  (orders || []).forEach((o: Record<string, unknown>) => {
    if (!o.user_id) return;
    const uid = o.user_id as string;
    if (!orderMap[uid]) orderMap[uid] = { count: 0, spent: 0 };
    orderMap[uid].count += 1;
    const statusStr = String(o.status || '').toLowerCase();
    if (statusStr !== 'cancelled') {
      orderMap[uid].spent += Number(o.total_amount || 0);
    }
  });

  return customerProfiles.map((p: Record<string, unknown>) => {
    const email = (p.email as string) || '';
    const rawName = (p.full_name as string) || '';
    const name = rawName.trim() ? rawName : (email ? email.split('@')[0] : 'Customer');
    const createdAt = (p.created_at as string) || '';
    const joinDate = createdAt ? createdAt.split('T')[0] : 'N/A';

    return {
      id: String(p.id || ''),
      name,
      email,
      phone: (p.phone as string) || '',
      address: (p.address as string) || '',
      totalOrders: orderMap[p.id as string]?.count || 0,
      totalSpent: orderMap[p.id as string]?.spent || 0,
      joinDate,
    };
  });
}

// ─── Item Reviews ─────────────────────────────────────────────────────────────

export interface ItemReview {
  id: string;
  menuItemId: string;
  orderId: string | null;
  userId: string | null;
  guestProfileId: string | null;
  reviewerName: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
}

export interface MenuItemRatingSummary {
  menuItemId: string;
  averageRating: number;
  reviewCount: number;
}

function rowToItemReview(row: Record<string, unknown>): ItemReview {
  return {
    id: row.id as string,
    menuItemId: row.menu_item_id as string,
    orderId: row.order_id as string | null,
    userId: row.user_id as string | null,
    guestProfileId: row.guest_profile_id as string | null,
    reviewerName: row.reviewer_name as string,
    rating: Number(row.rating),
    reviewText: row.review_text as string | null,
    createdAt: row.created_at as string,
  };
}

export async function fetchMenuItemReviews(menuItemId: string): Promise<ItemReview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('item_reviews')
    .select('*')
    .eq('menu_item_id', menuItemId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(rowToItemReview);
}

export async function fetchAllMenuItemRatings(): Promise<Record<string, MenuItemRatingSummary>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('item_reviews')
    .select('menu_item_id, rating');
  if (error) return {};
  const map: Record<string, { total: number; count: number }> = {};
  for (const row of (data || [])) {
    const id = row.menu_item_id as string;
    if (!map[id]) map[id] = { total: 0, count: 0 };
    map[id].total += Number(row.rating);
    map[id].count += 1;
  }
  const result: Record<string, MenuItemRatingSummary> = {};
  for (const [id, val] of Object.entries(map)) {
    result[id] = {
      menuItemId: id,
      averageRating: Math.round((val.total / val.count) * 10) / 10,
      reviewCount: val.count,
    };
  }
  return result;
}

export async function submitItemReview(review: {
  menuItemId: string;
  orderId?: string | null;
  userId?: string | null;
  guestProfileId?: string | null;
  reviewerName: string;
  rating: number;
  reviewText?: string;
}): Promise<ItemReview> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('item_reviews')
    .insert({
      menu_item_id: review.menuItemId,
      order_id: review.orderId ?? null,
      user_id: review.userId ?? null,
      guest_profile_id: review.guestProfileId ?? null,
      reviewer_name: review.reviewerName,
      rating: review.rating,
      review_text: review.reviewText || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToItemReview(data as Record<string, unknown>);
}

// ─── Stock Deduction ──────────────────────────────────────────────────────────

/**
 * Deducts stock & updates sold count for a single item
 */
export async function deductItemStock(menuItemId: string, quantityBought: number): Promise<void> {
  const supabase = createClient();

  const { data: item, error: fetchError } = await supabase
    .from('menu_items')
    .select('stock, sold_count')
    .eq('id', menuItemId)
    .single();

  if (fetchError || !item) return;

  const currentStock = Number(item.stock || 0);
  const currentSoldCount = Number(item.sold_count || 0);

  const newStock = Math.max(0, currentStock - quantityBought);
  const newSoldCount = currentSoldCount + quantityBought;

  await supabase
    .from('menu_items')
    .update({
      stock: newStock,
      sold_count: newSoldCount,
    })
    .eq('id', menuItemId);
}

/**
 * Call this function inside your checkout/place order handler
 */
export async function deductCartStock(cartItems: { id: string; quantity: number }[]): Promise<void> {
  for (const item of cartItems) {
    if (item.id && item.quantity > 0) {
      await deductItemStock(item.id, item.quantity);
    }
  }
}