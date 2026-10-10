'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import { fetchAdminMenuItems, updateMenuItem, MenuItem } from '@/lib/supabase/services';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

const CATEGORIES = [
  'All',
  'Beef',
  'Pork',
  'Chicken',
  'Seafood',
  'Pasta & Noodles',
  'Vegetables',
  'Desserts',
  'Packages',
];
const FORM_CATEGORIES = CATEGORIES.filter((c) => c !== 'All');

const PRESET_REASONS = [
  'Out of ingredients for today',
  'Kitchen maintenance',
  'Temporarily out of stock',
  'Seasonal dish unavailable',
];

interface NewMenuItemData {
  name: string;
  category: string;
  price: number | '';
  servingSize: string;
  description: string;
  image: string;
  featured: boolean;
}

const INITIAL_NEW_ITEM: NewMenuItemData = {
  name: '',
  category: 'Beef',
  price: '',
  servingSize: 'Per Tray',
  description: '',
  image: '',
  featured: false,
};

const CATEGORY_SLUG_MAP: Record<string, string> = {
  Beef: 'beef',
  Pork: 'pork',
  Chicken: 'chicken',
  Seafood: 'seafood',
  'Pasta & Noodles': 'pasta',
  Vegetables: 'vegetables',
  Desserts: 'desserts',
  Packages: 'packages',
  Drinks: 'drinks',
};

function toCategorySlug(category: string): string {
  const mapped = CATEGORY_SLUG_MAP[category]?.trim();
  if (mapped) return mapped;

  return (
    category
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'uncategorized'
  );
}

function splitDescription(description: string) {
  const [mainDescription, ingredients] = description.split(/\s+Ingredients:\s*/i, 2);
  return {
    description: mainDescription.trim(),
    ingredients: ingredients?.trim() ?? '',
  };
}

function joinDescription(description: string, ingredients: string) {
  const cleanDescription = description.trim();
  const cleanIngredients = ingredients.trim();
  return cleanIngredients
    ? `${cleanDescription} Ingredients: ${cleanIngredients}`
    : cleanDescription;
}

export default function AdminMenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editIngredients, setEditIngredients] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<NewMenuItemData>(INITIAL_NEW_ITEM);
  const [adding, setAdding] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Deactivate Modal state
  const [deactivateModalItem, setDeactivateModalItem] = useState<MenuItem | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminMenuItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();

    const supabase = createClient();
    const channel = supabase
      .channel('admin_menu_items_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        loadItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadItems]);

  const getItemActiveStatus = (item: MenuItem): boolean => {
    const rawIsActive = item.isActive ?? (item as unknown as { is_active?: boolean }).is_active;
    return rawIsActive !== false;
  };

  const getItemReason = (item: MenuItem): string => {
    return (
      item.unavailableReason ??
      (
        item as unknown as {
          deactivationReason?: string;
          deactivation_reason?: string;
          unavailable_reason?: string;
        }
      ).deactivationReason ??
      (
        item as unknown as {
          deactivationReason?: string;
          deactivation_reason?: string;
          unavailable_reason?: string;
        }
      ).deactivation_reason ??
      (
        item as unknown as {
          deactivationReason?: string;
          deactivation_reason?: string;
          unavailable_reason?: string;
        }
      ).unavailable_reason ??
      ''
    );
  };

  const filtered = items.filter((item) => {
    const matchCat = filterCategory === 'All' || item.category === filterCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleToggleClick = (item: MenuItem) => {
    const isActive = getItemActiveStatus(item);
    if (isActive) {
      setDeactivateModalItem(item);
      setDeactivationReason(PRESET_REASONS[0]);
      setCustomReason('');
    } else {
      activateItem(item.id);
    }
  };

  const activateItem = async (id: string) => {
    try {
      await updateMenuItem(id, {
        is_active: true,
        unavailable_reason: null,
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? ({
                ...i,
                isActive: true,
                unavailableReason: '',
              } as MenuItem)
            : i
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate item');
    }
  };

  const confirmDeactivation = async () => {
    if (!deactivateModalItem) return;
    const finalReason = deactivationReason === 'Other' ? customReason.trim() : deactivationReason;

    if (!finalReason) {
      alert('Please provide or select a reason for deactivation.');
      return;
    }

    try {
      await updateMenuItem(deactivateModalItem.id, {
        is_active: false,
        unavailable_reason: finalReason,
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === deactivateModalItem.id
            ? ({
                ...i,
                isActive: false,
                unavailableReason: finalReason,
              } as MenuItem)
            : i
        )
      );
      setDeactivateModalItem(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate item');
    }
  };

  const deleteMenuItem = async (item: MenuItem) => {
    if (!window.confirm(`Delete "${item.name}" permanently? This action cannot be undone.`)) {
      return;
    }

    setDeletingItemId(item.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('menu_items').delete().eq('id', item.id);
      if (error) throw error;

      setItems((prev) => prev.filter((menuItem) => menuItem.id !== item.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete menu item.');
    } finally {
      setDeletingItemId(null);
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await updateMenuItem(id, { featured: !current });
      setItems((prev) =>
        prev.map((i) => (i.id === id ? ({ ...i, featured: !current } as MenuItem) : i))
      );
    } catch {
      // silently fail
    }
  };

  const openEditItem = (item: MenuItem) => {
    const parts = splitDescription(item.description);
    setEditItem({ ...item, description: parts.description });
    setEditIngredients(parts.ingredients);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    const updatedItem = {
      ...editItem,
      description: joinDescription(editItem.description, editIngredients),
      ingredients: editIngredients.trim(),
    };
    setSaving(true);
    try {
      await updateMenuItem(updatedItem.id, {
        name: updatedItem.name,
        price: updatedItem.price,
        serving_size: updatedItem.servingSize,
        description: updatedItem.description,
        ingredients: updatedItem.ingredients,
      });
      setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
      setEditItem(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadMenuPhoto = async (file: File) => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;
    const filePath = `menu-items/${safeName}`;

    setUploadingPhoto(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Sign in with your admin account before uploading a menu photo.');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (profile?.role !== 'admin') {
        throw new Error(
          `Photo upload requires an admin account. The signed-in account ${user.email ?? user.id} has role "${profile?.role ?? 'missing'}".`
        );
      }

      const { error: uploadError } = await supabase.storage.from('MENU').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('MENU').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      setNewItem((prev) => ({ ...prev, image: publicUrl }));
      setPhotoPreview(publicUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCreateMenuItem = async () => {
    if (!newItem.name.trim()) {
      alert('Please enter an item name.');
      return;
    }
    if (newItem.price === '' || Number(newItem.price) < 0) {
      alert('Please enter a valid price.');
      return;
    }

    setAdding(true);
    try {
      const supabase = createClient();
      const payload = {
        id: crypto.randomUUID(),
        name: newItem.name.trim(),
        category: newItem.category,
        category_slug: toCategorySlug(newItem.category),
        price: Number(newItem.price),
        serving_size: newItem.servingSize || 'Per Tray',
        description: newItem.description.trim(),
        image: newItem.image.trim() || '/images/placeholder.jpg',
        image_alt: newItem.name.trim(),
        featured: newItem.featured,
        is_active: true,
        stock: 0,
        sold_count: 0,
      };

      const { data, error } = await supabase.from('menu_items').insert([payload]).select().single();

      if (error) throw error;

      if (data) {
        const createdItem: MenuItem = {
          id: data.id,
          name: data.name,
          category: data.category,
          categorySlug: data.category_slug || data.category.toLowerCase().replace(/\s+/g, '-'),
          price: Number(data.price),
          servingSize: data.serving_size || 'Per Tray',
          description: data.description || '',
          image: data.image || '/images/placeholder.jpg',
          imageAlt: data.image_alt || data.name,
          featured: Boolean(data.featured),
          isActive: true,
          unavailableReason: '',
          soldCount: Number(data.sold_count || 0),
        };

        setItems((prev) => [createdItem, ...prev]);
      }

      setIsAddModalOpen(false);
      setNewItem(INITIAL_NEW_ITEM);
      setPhotoPreview('');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String(err.message)
            : 'Failed to add menu item';
      alert(`Failed to add menu item: ${message}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminTopbar />
        <div className="px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="font-display text-2xl font-bold"
                style={{ color: 'var(--admin-text)' }}
              >
                Menu Items
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                {loading ? 'Loading…' : `${items.length} items`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: '#D4A017',
                  color: '#1A0F0A',
                }}
              >
                <Icon name="PlusCircleIcon" size={16} />
                Add Menu Item
              </button>

              <button
                onClick={loadItems}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
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

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Icon
                name="MagnifyingGlassIcon"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--admin-surface)',
                  border: '1px solid var(--admin-border)',
                  color: '#F5EDE0',
                  width: 220,
                }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: filterCategory === cat ? '#D4A017' : 'var(--admin-surface)',
                    color: filterCategory === cat ? '#1A0F0A' : 'var(--admin-muted)',
                    border: '1px solid var(--admin-border)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl h-64"
                  style={{ background: 'var(--admin-surface)' }}
                />
              ))}
            </div>
          )}

          {/* Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item) => {
                const isActive = getItemActiveStatus(item);
                const reason = getItemReason(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl overflow-hidden flex flex-col transition-opacity duration-300"
                    style={{
                      background: 'var(--admin-surface)',
                      border: '1px solid var(--admin-border)',
                      opacity: isActive ? 1 : 0.65,
                    }}
                  >
                    <div className="relative h-40">
                      <AppImage src={item.image} alt={item.name} fill className="object-cover" />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(to top, rgba(26,15,10,0.7) 0%, transparent 60%)',
                        }}
                      />
                      {item.featured && (
                        <span
                          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: '#D4A017', color: '#1A0F0A' }}
                        >
                          Featured
                        </span>
                      )}
                      <span
                        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                          color: isActive ? '#4ADE80' : '#F87171',
                        }}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <div>
                        <p
                          className="font-semibold text-sm leading-tight"
                          style={{ color: 'var(--admin-text)' }}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                          {item.category} · {item.servingSize}
                        </p>
                      </div>

                      {!isActive && reason && (
                        <p
                          className="text-xs italic py-1 px-2 rounded"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171' }}
                        >
                          Reason: {reason}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-bold text-sm" style={{ color: '#D4A017' }}>
                          ₱{item.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => openEditItem(item)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: 'rgba(212,160,23,0.12)',
                            color: '#D4A017',
                            border: '1px solid rgba(212,160,23,0.3)',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openEditItem(item)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: 'rgba(59,130,246,0.1)',
                            color: '#93C5FD',
                            border: '1px solid rgba(59,130,246,0.3)',
                          }}
                        >
                          Ingredients
                        </button>
                        <button
                          onClick={() => handleToggleClick(item)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: isActive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                            color: isActive ? '#F87171' : '#4ADE80',
                            border: `1px solid ${isActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                          }}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => toggleFeatured(item.id, Boolean(item.featured))}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{
                            background: item.featured ? 'rgba(212,160,23,0.2)' : 'var(--admin-bg)',
                            color: item.featured ? '#D4A017' : 'var(--admin-muted)',
                            border: '1px solid var(--admin-border)',
                          }}
                          title={item.featured ? 'Remove from featured' : 'Mark as featured'}
                        >
                          <Icon name="StarIcon" size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => deleteMenuItem(item)}
                        disabled={deletingItemId === item.id}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          color: '#F87171',
                          borderColor: 'rgba(239,68,68,0.3)',
                        }}
                      >
                        <Icon
                          name={deletingItemId === item.id ? 'ArrowPathIcon' : 'TrashIcon'}
                          size={14}
                          className={deletingItemId === item.id ? 'animate-spin' : ''}
                        />
                        {deletingItemId === item.id ? 'Deleting…' : 'Delete Product'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add New Menu Item Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg" style={{ color: '#F5EDE0' }}>
                Add New Menu Item
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ color: 'var(--admin-muted)' }}
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--admin-muted)' }}
                >
                  Dish Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Crispy Pata Extra"
                  value={newItem.name}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    color: '#F5EDE0',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--admin-muted)' }}
                  >
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
                    style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      color: '#F5EDE0',
                    }}
                  >
                    {FORM_CATEGORIES.map((c) => (
                      <option key={c} value={c} style={{ background: '#1A0F0A', color: '#F5EDE0' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--admin-muted)' }}
                  >
                    Serving Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Per Tray, 4-6 Pax"
                    value={newItem.servingSize}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, servingSize: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      color: '#F5EDE0',
                    }}
                  />
                </div>
              </div>

              <div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--admin-muted)' }}
                  >
                    Price (₱) *
                  </label>
                  <input
                    type="number"
                    placeholder="850"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        price: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      color: '#F5EDE0',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--admin-muted)' }}
                >
                  Menu Photo
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await uploadMenuPhoto(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                      id="menu-item-photo-upload"
                    />
                    <label
                      htmlFor="menu-item-photo-upload"
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer"
                      style={{
                        background: 'var(--admin-bg)',
                        border: '1px solid var(--admin-border)',
                        color: '#F5EDE0',
                      }}
                    >
                      <Icon name="PhotoIcon" size={16} />
                      {uploadingPhoto ? 'Uploading…' : 'Upload Photo'}
                    </label>
                    {newItem.image && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewItem((prev) => ({ ...prev, image: '' }));
                          setPhotoPreview('');
                        }}
                        className="text-xs font-medium"
                        style={{ color: '#F87171' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {(photoPreview || newItem.image) && (
                    <div
                      className="relative h-28 w-full overflow-hidden rounded-xl border"
                      style={{ borderColor: 'var(--admin-border)' }}
                    >
                      <AppImage
                        src={photoPreview || newItem.image}
                        alt="Menu item preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Or paste image URL here"
                    value={newItem.image}
                    onChange={(e) => {
                      const next = e.target.value;
                      setNewItem((prev) => ({ ...prev, image: next }));
                      setPhotoPreview(next);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      color: '#F5EDE0',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--admin-muted)' }}
                >
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed description..."
                  value={newItem.description}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    color: '#F5EDE0',
                  }}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-sm text-stone-300">
                <input
                  type="checkbox"
                  checked={newItem.featured}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="rounded accent-[#D4A017]"
                />
                Mark as Featured Dish
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--admin-bg)',
                  color: 'var(--admin-muted)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMenuItem}
                disabled={adding}
                className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: '#D4A017', color: '#1A0F0A' }}
              >
                {adding ? 'Adding…' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Reason Modal */}
      {deactivateModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
          >
            <h3 className="font-display font-bold text-lg" style={{ color: '#F5EDE0' }}>
              Deactivate Item: {deactivateModalItem.name}
            </h3>
            <p className="text-xs text-stone-400">
              Please specify the reason for deactivating this item. This reason will be posted on
              the menu so customers know why it cannot be ordered.
            </p>

            <div className="space-y-2">
              {PRESET_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="deactivationReason"
                    value={reason}
                    checked={deactivationReason === reason}
                    onChange={() => setDeactivationReason(reason)}
                  />
                  {reason}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
                <input
                  type="radio"
                  name="deactivationReason"
                  value="Other"
                  checked={deactivationReason === 'Other'}
                  onChange={() => setDeactivationReason('Other')}
                />
                Custom Reason
              </label>
            </div>

            {deactivationReason === 'Other' && (
              <textarea
                rows={2}
                placeholder="Type custom reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  color: '#F5EDE0',
                }}
              />
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeactivateModalItem(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--admin-bg)',
                  color: 'var(--admin-muted)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivation}
                className="flex-1 py-2 rounded-xl text-sm font-bold"
                style={{ background: '#EF4444', color: '#FFFFFF' }}
              >
                Deactivate Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg" style={{ color: '#F5EDE0' }}>
                Edit Item
              </h3>
              <button onClick={() => setEditItem(null)} style={{ color: 'var(--admin-muted)' }}>
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Price (₱)', key: 'price', type: 'number' },
                { label: 'Serving Size', key: 'servingSize', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--admin-muted)' }}
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    value={editItem[key as keyof MenuItem] as string | number}
                    onChange={(e) =>
                      setEditItem((prev) =>
                        prev
                          ? ({
                              ...prev,
                              [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                            } as MenuItem)
                          : null
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      color: '#F5EDE0',
                    }}
                  />
                </div>
              ))}
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--admin-muted)' }}
                >
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editItem.description || ''}
                  onChange={(e) =>
                    setEditItem((prev) =>
                      prev ? ({ ...prev, description: e.target.value } as MenuItem) : null
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    color: '#F5EDE0',
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--admin-muted)' }}
                >
                  Ingredients
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. pork belly, vinegar, soy sauce, garlic"
                  value={editIngredients}
                  onChange={(e) => setEditIngredients(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    color: '#F5EDE0',
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--admin-muted)' }}>
                  Separate ingredients with commas. Leave blank to remove the ingredient list.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditItem(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--admin-bg)',
                  color: 'var(--admin-muted)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: '#D4A017', color: '#1A0F0A' }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
