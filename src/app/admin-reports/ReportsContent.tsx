'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { generateSalesReportPDF, ReportOrder } from '@/lib/generateSalesReportPDF';
import { createClient } from '@/lib/supabase/client';
import { fetchInventoryItems, fetchExpenses } from '@/lib/supabase/services';

type RangeKey = '15days' | '1month' | '2months' | 'all' | 'custom';

const RANGES: { key: RangeKey; label: string; description: string; days?: number }[] = [
  { key: '15days', label: '1-15 Days', description: 'Sales from the last 15 days', days: 15 },
  { key: '1month', label: '1 Month', description: 'Sales from the last 30 days', days: 30 },
  { key: '2months', label: '2 Months', description: 'Sales from the last 60 days', days: 60 },
  { key: 'all', label: 'Export All', description: 'Every order on record' },
];

const fmt = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function ReportsContent() {
  const [exporting, setExporting] = useState<RangeKey | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const handleExport = async (key: RangeKey) => {
    const preset = RANGES.find(r => r.key === key);
    if (key === 'custom') {
      if (!fromDate || !toDate) {
        toast.error('Please select both a start and an end date.');
        return;
      }
      if (fromDate > toDate) {
        toast.error('Start date must not be after the end date.');
        return;
      }
    }
    const range = {
      label: key === 'custom' ? `${fmt(fromDate)} - ${fmt(toDate)}` : preset!.label,
      days: preset?.days,
    };
    const customStart = key === 'custom' ? new Date(`${fromDate}T00:00:00`) : null;
    const customEnd = key === 'custom' ? new Date(`${toDate}T23:59:59.999`) : null;
    try {
      setExporting(key);
      toast.info(`Fetching ${range.label} order records...`);

      const supabase = createClient();
      let query = supabase.from('orders').select('*, order_items(*)');

      if (customStart && customEnd) {
        query = query.gte('created_at', customStart.toISOString()).lte('created_at', customEnd.toISOString());
      } else if (range.days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - range.days);
        startDate.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: rawOrders, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        throw new Error('Failed to load orders from database');
      }

      if (!rawOrders || rawOrders.length === 0) {
        toast.warning(`No orders found for the ${range.label} range.`);
        return;
      }

      const reportOrders: ReportOrder[] = rawOrders.map((o: any) => ({
        id: o.id || o.order_id || 'N/A',
        created_at: o.created_at || o.createdAt,
        customer_name:
          o.customer_name ||
          (o.first_name ? `${o.first_name} ${o.last_name || ''}`.trim() : 'Guest Customer'),
        items_summary: Array.isArray(o.order_items)
          ? o.order_items
              .map((item: any) => `${item.quantity || 1}x ${item.menu_item_name || item.name || item.menuItem?.name || 'Item'}`)
              .join(', ')
          : Array.isArray(o.items)
          ? o.items.map((item: any) => `${item.quantity || 1}x ${item.name || item.menuItem?.name || 'Item'}`).join(', ')
          : typeof o.items === 'string'
          ? o.items
          : 'No item details',
        total_amount: Number(o.total_amount || o.totalPrice || o.total || 0),
        status: o.status || 'Completed',
      }));

      const [inventory, allExpenses] = await Promise.all([
        fetchInventoryItems().catch(() => []),
        fetchExpenses().catch(() => []),
      ]);
      const cutoff = customStart
        ? customStart.getTime()
        : range.days
        ? new Date(Date.now() - range.days * 86400000).setHours(0, 0, 0, 0)
        : null;
      const expenses = allExpenses.filter(e => {
        const t = new Date(e.date).getTime();
        return (cutoff === null || t >= cutoff) && (!customEnd || t <= customEnd.getTime());
      });

      await generateSalesReportPDF(reportOrders, {
        dateRangeLabel: range.label,
        generatedBy: 'Admin Representative',
        inventory,
        expenses,
      });

      toast.success(`${range.label} sales report generated successfully!`);
    } catch (err) {
      console.error('Export PDF error:', err);
      toast.error('Failed to generate PDF report.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>
          Reports
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--admin-muted)' }}>
          Generate printable PDF reports with sales, inventory and expenses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RANGES.map(range => {
          const busy = exporting === range.key;
          return (
            <div
              key={range.key}
              className="rounded-2xl p-5 flex items-center justify-between gap-4"
              style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
            >
              <div>
                <p className="font-semibold" style={{ color: 'var(--admin-text)' }}>
                  {range.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>
                  {range.description}
                </p>
              </div>
              <button
                onClick={() => handleExport(range.key)}
                disabled={exporting !== null}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                style={{ background: '#D4A017', color: '#1b110e' }}
              >
                <Icon name="ArrowDownTrayIcon" size={14} />
                {busy ? 'Generating...' : 'Export PDF'}
              </button>
            </div>
          );
        })}
      </div>

      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
      >
        <div>
          <p className="font-semibold" style={{ color: 'var(--admin-text)' }}>Custom date range</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--admin-muted)' }}>
            Pick the exact start and end date for the report.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          {[
            { label: 'From', value: fromDate, set: setFromDate },
            { label: 'To', value: toDate, set: setToDate },
          ].map(f => (
            <label key={f.label} className="text-xs flex flex-col gap-1" style={{ color: 'var(--admin-muted)' }}>
              {f.label}
              <input
                type="date"
                value={f.value}
                max={today}
                onChange={e => f.set(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'transparent', color: 'var(--admin-text)', border: '1px solid var(--admin-border)', colorScheme: 'dark' }}
              />
            </label>
          ))}
          <button
            onClick={() => handleExport('custom')}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: '#D4A017', color: '#1b110e' }}
          >
            <Icon name="ArrowDownTrayIcon" size={14} />
            {exporting === 'custom' ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
