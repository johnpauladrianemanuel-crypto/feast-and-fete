'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

type StockStatus = 'OK' | 'Low Stock' | 'Out of Stock';

interface MenuItemInventory {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  status: StockStatus;
  lastUpdated: string;
}

const STATUS_STYLES: Record<StockStatus, { bg: string; text: string; dot: string }> = {
  OK: { bg: 'rgba(34,197,94,0.12)', text: '#4ADE80', dot: '#4ADE80' },
  'Low Stock': { bg: 'rgba(234,179,8,0.12)', text: '#EAB308', dot: '#EAB308' },
  'Out of Stock': { bg: 'rgba(239,68,68,0.12)', text: '#F87171', dot: '#F87171' },
};

export default function AdminInventoryPage() {
  const [items, setItems] = useState<MenuItemInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<StockStatus | 'All'>('All');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, stock, updated_at');

      if (error) throw error;

      const mapped: MenuItemInventory[] = (data || []).map((item: any) => {
        const stock = item.stock ?? 0;
        let status: StockStatus = 'OK';
        
        if (stock === 0) {
          status = 'Out of Stock';
        } else if (stock <= 7) {
          status = 'Low Stock';
        }

        return {
          id: item.id,
          name: item.name,
          unit: 'pcs/tray',
          currentStock: stock,
          reorderLevel: 7,
          status,
          lastUpdated: item.updated_at ? item.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
        };
      });

      setItems(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const startEdit = (item: MenuItemInventory) => {
    setEditId(item.id);
    setEditStock(String(item.currentStock));
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const newStock = Number(editStock);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('menu_items')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      let status: StockStatus = 'OK';
      if (newStock === 0) status = 'Out of Stock';
      else if (newStock <= 7) status = 'Low Stock';

      setItems(prev => prev.map(i => i.id === id ? {
        ...i,
        currentStock: newStock,
        status,
        lastUpdated: new Date().toISOString().split('T')[0],
      } : i));
      setEditId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(i => filterStatus === 'All' || i.status === filterStatus);

  const counts = {
    All: items.length,
    OK: items.filter(i => i.status === 'OK').length,
    'Low Stock': items.filter(i => i.status === 'Low Stock').length,
    'Out of Stock': items.filter(i => i.status === 'Out of Stock').length,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminTopbar />
        <div className="px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>Inventory & Stock Management</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>Real-time stock tracking for menu items (Low stock threshold: ≤ 7)</p>
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

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Items', value: counts.All, status: 'All' as const, color: '#F5EDE0' },
              { label: 'In Stock', value: counts.OK, status: 'OK' as const, color: '#4ADE80' },
              { label: 'Low Stock', value: counts['Low Stock'], status: 'Low Stock' as const, color: '#EAB308' },
              { label: 'Out of Stock', value: counts['Out of Stock'], status: 'Out of Stock' as const, color: '#F87171' },
            ].map(card => {
              const isActive = filterStatus === card.status;
              return (
                <div
                  key={card.label}
                  onClick={() => setFilterStatus(card.status)}
                  className="rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'var(--admin-surface)',
                    border: `1px solid ${isActive ? '#D4A017' : 'var(--admin-border)'}`,
                    boxShadow: isActive ? '0 0 0 1px #D4A017' : 'none',
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>{card.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(['All', 'OK', 'Low Stock', 'Out of Stock'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: filterStatus === s ? (s === 'All' ? '#D4A017' : STATUS_STYLES[s as StockStatus]?.bg ?? '#D4A017') : 'var(--admin-surface)',
                  color: filterStatus === s ? (s === 'All' ? '#1A0F0A' : STATUS_STYLES[s as StockStatus]?.text ?? '#1A0F0A') : 'var(--admin-muted)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                {s} ({counts[s]})
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-xl" style={{ background: 'var(--admin-surface)' }} />)}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    {['Menu Item', 'Unit', 'Current Stock', 'Alert Threshold', 'Status', 'Last Updated', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none' }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_STYLES[item.status].dot }} />
                          <span className="font-medium" style={{ color: '#F5EDE0' }}>{item.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--admin-muted)' }}>{item.unit}</td>
                      <td className="px-5 py-3.5">
                        {editId === item.id ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={e => setEditStock(e.target.value)}
                            className="w-20 px-2 py-1 rounded-lg text-sm outline-none"
                            style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }}
                          />
                        ) : (
                          <span className="font-semibold" style={{ color: item.currentStock === 0 ? '#F87171' : item.currentStock <= 7 ? '#EAB308' : '#F5EDE0' }}>
                            {item.currentStock}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span style={{ color: 'var(--admin-muted)' }}>≤ 7 stocks</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: STATUS_STYLES[item.status].bg, color: STATUS_STYLES[item.status].text }}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--admin-muted)' }}>{item.lastUpdated}</td>
                      <td className="px-5 py-3.5">
                        {editId === item.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(item.id)} disabled={saving} className="px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-60" style={{ background: '#D4A017', color: '#1A0F0A' }}>
                              {saving ? '…' : 'Save'}
                            </button>
                            <button onClick={() => setEditId(null)} className="px-3 py-1 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(item)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors" style={{ background: 'rgba(212,160,23,0.1)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.25)' }}>
                            <Icon name="PencilSquareIcon" size={12} />
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>No items found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}