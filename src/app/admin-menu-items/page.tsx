'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import { fetchMenuItems, updateMenuItem, MenuItem } from '@/lib/supabase/services';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

const CATEGORIES = ['All', 'Beef', 'Pork', 'Chicken', 'Seafood', 'Pasta & Noodles', 'Vegetables', 'Desserts', 'Packages'];

export default function AdminMenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMenuItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filtered = items.filter(item => {
    const matchCat = filterCategory === 'All' || item.category === filterCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateMenuItem(id, { is_active: !current });
      setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: !current } : i));
    } catch {
      // silently fail
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await updateMenuItem(id, { featured: !current });
      setItems(prev => prev.map(i => i.id === id ? { ...i, featured: !current } : i));
    } catch {
      // silently fail
    }
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await updateMenuItem(editItem.id, {
        name: editItem.name,
        price: editItem.price,
        stock: editItem.stock,
        serving_size: editItem.servingSize,
        description: editItem.description,
      });
      setItems(prev => prev.map(i => i.id === editItem.id ? editItem : i));
      setEditItem(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
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
              <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>Menu Items</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                {loading ? 'Loading…' : `${items.length} items`}
              </p>
            </div>
            <button
              onClick={loadItems}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }}
            >
              <Icon name="ArrowPathIcon" size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
              <Icon name="ExclamationCircleIcon" size={16} />
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: '#F5EDE0', width: 220 }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: filterCategory === cat ? '#D4A017' : 'var(--admin-surface)', color: filterCategory === cat ? '#1A0F0A' : 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="rounded-2xl h-64" style={{ background: 'var(--admin-surface)' }} />
              ))}
            </div>
          )}

          {/* Grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(item => (
                <div key={item.id} className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', opacity: item.isActive ? 1 : 0.6 }}>
                  <div className="relative h-40">
                    <AppImage src={item.image} alt={item.imageAlt} fill className="object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,15,10,0.7) 0%, transparent 60%)' }} />
                    {item.featured && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#D4A017', color: '#1A0F0A' }}>Featured</span>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: item.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: item.isActive ? '#4ADE80' : '#F87171' }}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <div>
                      <p className="font-semibold text-sm leading-tight" style={{ color: '#F5EDE0' }}>{item.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>{item.category} · {item.servingSize}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-sm" style={{ color: '#D4A017' }}>₱{item.price.toLocaleString()}</span>
                      <span className="text-xs" style={{ color: 'var(--admin-muted)' }}>Stock: {item.stock}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setEditItem(item)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: 'rgba(212,160,23,0.12)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(item.id, item.isActive)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: item.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: item.isActive ? '#F87171' : '#4ADE80', border: `1px solid ${item.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}
                      >
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => toggleFeatured(item.id, item.featured)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: item.featured ? 'rgba(212,160,23,0.2)' : 'var(--admin-bg)', color: item.featured ? '#D4A017' : 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}
                        title={item.featured ? 'Remove from featured' : 'Mark as featured'}
                      >
                        <Icon name="StarIcon" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !loading && (
                <div className="col-span-full text-center py-16" style={{ color: 'var(--admin-muted)' }}>
                  <Icon name="ArchiveBoxXMarkIcon" size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No items found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg" style={{ color: '#F5EDE0' }}>Edit Item</h3>
              <button onClick={() => setEditItem(null)} style={{ color: 'var(--admin-muted)' }}><Icon name="XMarkIcon" size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Price (₱)', key: 'price', type: 'number' },
                { label: 'Stock', key: 'stock', type: 'number' },
                { label: 'Serving Size', key: 'servingSize', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--admin-muted)' }}>{label}</label>
                  <input
                    type={type}
                    value={(editItem as Record<string, unknown>)[key] as string}
                    onChange={e => setEditItem(prev => prev ? { ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value } : null)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--admin-muted)' }}>Description</label>
                <textarea
                  rows={3}
                  value={editItem.description}
                  onChange={e => setEditItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditItem(null)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: '#D4A017', color: '#1A0F0A' }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
