'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import Icon from '@/components/ui/AppIcon';
import {
  addInventoryItem,
  fetchInventoryItems,
  getInventoryReorderLevel,
  isStrictInventoryThresholdUnit,
  InventoryItem,
  StockStatus,
  updateInventoryItem,
} from '@/lib/supabase/services';

const STATUS_STYLES: Record<StockStatus, { bg: string; text: string; dot: string }> = {
  OK: { bg: 'rgba(34,197,94,0.12)', text: '#4ADE80', dot: '#4ADE80' },
  'Low Stock': { bg: 'rgba(234,179,8,0.12)', text: '#EAB308', dot: '#EAB308' },
  'Out of Stock': { bg: 'rgba(239,68,68,0.12)', text: '#F87171', dot: '#F87171' },
};

type IngredientDraft = {
  name: string;
  unit: string;
  currentStock: string;
  reorderLevel: string;
};

const EMPTY_DRAFT: IngredientDraft = {
  name: '',
  unit: 'kg',
  currentStock: '0',
  reorderLevel: '3',
};

function formatQuantity(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<StockStatus | 'All'>('All');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [draft, setDraft] = useState<IngredientDraft>(EMPTY_DRAFT);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchInventoryItems());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ingredients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const startEdit = (item: InventoryItem) => {
    setEditId(item.id);
    setEditStock(String(item.currentStock));
    setError(null);
  };

  const saveEdit = async (id: string) => {
    const currentStock = Number(editStock);
    if (!Number.isFinite(currentStock) || currentStock < 0) {
      setError('Current amount must be a valid non-negative number.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const item = items.find((inventoryItem) => inventoryItem.id === id);
      if (!item) throw new Error('Ingredient not found. Refresh the inventory and try again.');
      await updateInventoryItem(id, currentStock, item.reorderLevel, item.unit);
      setEditId(null);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ingredient.');
    } finally {
      setSaving(false);
    }
  };

  const saveNewIngredient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentStock = Number(draft.currentStock);
    const reorderLevel = Number(draft.reorderLevel);
    if (!draft.name.trim() || !draft.unit.trim()) {
      setError('Ingredient name and unit are required.');
      return;
    }
    if (
      !Number.isFinite(currentStock) ||
      currentStock < 0 ||
      !Number.isFinite(reorderLevel) ||
      reorderLevel < 0
    ) {
      setError('Current amount and low-stock alert must be valid non-negative numbers.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const createdItem = await addInventoryItem({
        name: draft.name.trim(),
        unit: draft.unit.trim(),
        currentStock,
        reorderLevel,
      });
      setItems((prev) => [...prev, createdItem].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(EMPTY_DRAFT);
      setIsAddFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ingredient.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((item) => filterStatus === 'All' || item.status === filterStatus);
  const counts = {
    All: items.length,
    OK: items.filter((item) => item.status === 'OK').length,
    'Low Stock': items.filter((item) => item.status === 'Low Stock').length,
    'Out of Stock': items.filter((item) => item.status === 'Out of Stock').length,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminTopbar />
        <div className="px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1
                className="font-display text-2xl font-bold"
                style={{ color: 'var(--admin-text)' }}
              >
                Ingredients Inventory
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                Ingredient catalog for your menu. Stock status is based on each ingredient&apos;s
                saved quantity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsAddFormOpen((open) => !open);
                  setError(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#D4A017', color: '#1A0F0A' }}
              >
                <Icon name="PlusCircleIcon" size={15} />
                Add Ingredient
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
              role="alert"
            >
              <Icon name="ExclamationCircleIcon" size={16} />
              {error}
            </div>
          )}

          {isAddFormOpen && (
            <form
              onSubmit={saveNewIngredient}
              className="rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
              }}
            >
              <label className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>
                Ingredient
                <input
                  required
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Garlic"
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    color: '#F5EDE0',
                  }}
                />
              </label>
              <label className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>
                Unit
                <input
                  required
                  value={draft.unit}
                  onChange={(event) =>
                    setDraft((prev) => {
                      const unit = event.target.value;
                      return {
                        ...prev,
                        unit,
                        reorderLevel: String(
                          getInventoryReorderLevel(unit, Number(prev.reorderLevel))
                        ),
                      };
                    })
                  }
                  placeholder="kg, L, pcs"
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    color: '#F5EDE0',
                  }}
                />
              </label>
              <label className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>
                Current amount ({draft.unit || 'unit'})
                <div
                  className="mt-1 flex items-center rounded-lg border"
                  style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
                >
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={draft.currentStock}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, currentStock: event.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-l-lg text-sm outline-none"
                    style={{ color: '#F5EDE0' }}
                  />
                  <span
                    className="px-3 text-xs whitespace-nowrap"
                    style={{ color: 'var(--admin-muted)' }}
                  >
                    {draft.unit || 'unit'}
                  </span>
                </div>
              </label>
              <label className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>
                {isStrictInventoryThresholdUnit(draft.unit)
                  ? `Low-stock threshold (< ${formatQuantity(Number(draft.reorderLevel))} ${draft.unit})`
                  : 'Alert when at or below'}
                <input
                  required
                  type="number"
                  min="0"
                  step="any"
                  value={draft.reorderLevel}
                  disabled={isStrictInventoryThresholdUnit(draft.unit)}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, reorderLevel: event.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-60"
                  style={{
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    color: '#F5EDE0',
                  }}
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
                style={{ background: '#D4A017', color: '#1A0F0A' }}
              >
                {saving ? 'Saving…' : 'Save Ingredient'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Ingredients',
                value: counts.All,
                status: 'All' as const,
                color: '#F5EDE0',
              },
              { label: 'Good Stock', value: counts.OK, status: 'OK' as const, color: '#4ADE80' },
              {
                label: 'Low Stock',
                value: counts['Low Stock'],
                status: 'Low Stock' as const,
                color: '#EAB308',
              },
              {
                label: 'Out of Stock',
                value: counts['Out of Stock'],
                status: 'Out of Stock' as const,
                color: '#F87171',
              },
            ].map((card) => {
              const isActive = filterStatus === card.status;
              return (
                <button
                  key={card.label}
                  onClick={() => setFilterStatus(card.status)}
                  className="rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'var(--admin-surface)',
                    border: `1px solid ${isActive ? '#D4A017' : 'var(--admin-border)'}`,
                    boxShadow: isActive ? '0 0 0 1px #D4A017' : 'none',
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>
                    {card.label}
                  </span>
                  <span className="block text-3xl font-bold mt-1" style={{ color: card.color }}>
                    {card.value}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {(['All', 'OK', 'Low Stock', 'Out of Stock'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background:
                    filterStatus === status
                      ? status === 'All'
                        ? '#D4A017'
                        : (STATUS_STYLES[status]?.bg ?? '#D4A017')
                      : 'var(--admin-surface)',
                  color:
                    filterStatus === status
                      ? status === 'All'
                        ? '#1A0F0A'
                        : (STATUS_STYLES[status]?.text ?? '#1A0F0A')
                      : 'var(--admin-muted)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                {status === 'OK' ? 'Good Stock' : status} ({counts[status]})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className="h-12 rounded-xl"
                  style={{ background: 'var(--admin-surface)' }}
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-x-auto"
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
              }}
            >
              <table className="w-full min-w-[850px] text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    {[
                      'Ingredient',
                      'Unit',
                      'Current Amount',
                      'Status',
                      'Last Updated',
                      'Used In Menu',
                      'Actions',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--admin-muted)' }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom:
                          index < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none',
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: STATUS_STYLES[item.status].dot }}
                          />
                          <span className="font-medium" style={{ color: 'var(--admin-text)' }}>
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--admin-muted)' }}>
                        {item.unit}
                      </td>
                      <td className="px-5 py-3.5">
                        {editId === item.id ? (
                          <div
                            className="inline-flex items-center rounded-lg border"
                            style={{
                              background: 'var(--admin-bg)',
                              borderColor: 'var(--admin-border)',
                            }}
                          >
                            <input
                              aria-label={`Current amount for ${item.name} in ${item.unit}`}
                              type="number"
                              min="0"
                              step="any"
                              value={editStock}
                              onChange={(event) => setEditStock(event.target.value)}
                              className="w-20 px-2 py-1 rounded-l-lg text-sm outline-none"
                              style={{ color: '#F5EDE0' }}
                            />
                            <span className="px-2 text-xs" style={{ color: 'var(--admin-muted)' }}>
                              {item.unit}
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold" style={{ color: 'var(--admin-text)' }}>
                            {formatQuantity(item.currentStock)} {item.unit}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: STATUS_STYLES[item.status].bg,
                            color: STATUS_STYLES[item.status].text,
                          }}
                        >
                          {item.status === 'OK' ? 'Good Stock' : item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--admin-muted)' }}>
                        {item.lastUpdated}
                      </td>
                      <td
                        className="px-5 py-3.5 text-xs max-w-[260px]"
                        style={{ color: 'var(--admin-muted)' }}
                      >
                        {item.menuItemNames.length > 0 ? item.menuItemNames.join(', ') : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {editId === item.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => saveEdit(item.id)}
                              disabled={saving}
                              className="px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-60"
                              style={{ background: '#D4A017', color: '#1A0F0A' }}
                            >
                              {saving ? '…' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="px-3 py-1 rounded-lg text-xs"
                              style={{
                                background: 'var(--admin-bg)',
                                color: 'var(--admin-muted)',
                                border: '1px solid var(--admin-border)',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              background: 'rgba(212,160,23,0.1)',
                              color: '#D4A017',
                              border: '1px solid rgba(212,160,23,0.25)',
                            }}
                          >
                            <Icon name="PencilSquareIcon" size={12} />
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-10 text-center text-sm"
                        style={{ color: 'var(--admin-muted)' }}
                      >
                        No ingredients found for this filter.
                      </td>
                    </tr>
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
