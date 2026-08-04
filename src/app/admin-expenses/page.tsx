'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';
import { fetchExpenses, addExpense, deleteExpense, Expense } from '@/lib/supabase/services';
import Icon from '@/components/ui/AppIcon';

const CATEGORIES = ['Ingredients', 'Packaging', 'Utilities', 'Labor', 'Other'];
const CATEGORY_COLORS: Record<string, string> = {
  Ingredients: '#D4A017',
  Packaging: '#60A5FA',
  Utilities: '#FB923C',
  Labor: '#A78BFA',
  Other: '#94A3B8',
};

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', category: 'Ingredients', description: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const filtered = expenses.filter(e => filterCat === 'All' || e.category === filterCat);
  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  }));

  const handleAdd = async () => {
    if (!form.date || !form.description || !form.amount) return;
    setSubmitting(true);
    try {
      const newExp = await addExpense({
        date: form.date,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
      });
      setExpenses(prev => [newExp, ...prev]);
      setForm({ date: '', category: 'Ingredients', description: '', amount: '' });
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete expense');
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
              <h1 className="font-display text-2xl font-bold" style={{ color: '#F5EDE0' }}>Expenses</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>Track operational costs and spending</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              style={{ background: '#D4A017', color: '#1A0F0A' }}
            >
              <Icon name="PlusIcon" size={16} />
              Add Expense
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
              <Icon name="ExclamationCircleIcon" size={16} />
              {error}
            </div>
          )}

          {/* Category breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {categoryTotals.map(({ cat, total: catTotal }) => (
              <div key={cat} className="rounded-2xl p-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                  <p className="text-xs font-medium" style={{ color: 'var(--admin-muted)' }}>{cat}</p>
                </div>
                <p className="text-lg font-bold" style={{ color: CATEGORY_COLORS[cat] }}>₱{catTotal.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Filter + total */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {['All', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: filterCat === cat ? '#D4A017' : 'var(--admin-surface)', color: filterCat === cat ? '#1A0F0A' : 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-sm font-semibold" style={{ color: '#F5EDE0' }}>
              Total: <span style={{ color: '#D4A017' }}>₱{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-12 rounded-xl" style={{ background: 'var(--admin-surface)' }} />)}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    {['Date', 'Category', 'Description', 'Amount', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exp, i) => (
                    <tr key={exp.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none' }}>
                      <td className="px-5 py-3.5 text-xs font-mono" style={{ color: 'var(--admin-muted)' }}>{exp.date}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: `${CATEGORY_COLORS[exp.category]}20`, color: CATEGORY_COLORS[exp.category] }}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: '#F5EDE0' }}>{exp.description}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: '#D4A017' }}>₱{exp.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: 'var(--admin-muted)' }}>
                          <Icon name="TrashIcon" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--admin-muted)' }}>No expenses found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg" style={{ color: '#F5EDE0' }}>Add Expense</h3>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--admin-muted)' }}><Icon name="XMarkIcon" size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--admin-muted)' }}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--admin-muted)' }}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--admin-muted)' }}>Description</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Wet market run — pork, beef"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--admin-muted)' }}>Amount (₱)</label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: '#F5EDE0' }} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted)', border: '1px solid var(--admin-border)' }}>Cancel</button>
              <button onClick={handleAdd} disabled={submitting} className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: '#D4A017', color: '#1A0F0A' }}>
                {submitting ? 'Adding…' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
