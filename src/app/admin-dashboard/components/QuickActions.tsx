'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { generateSalesReportPDF, ReportOrder } from '@/lib/generateSalesReportPDF';
import { createClient } from '@/lib/supabase/client';

type DateRangeOption = '15days' | '1month' | '2months' | '3months';

interface RangeConfig {
  label: string;
  days?: number;
  isFixedRange?: boolean;
}

const RANGE_CONFIGS: Record<DateRangeOption, RangeConfig> = {
  '15days': { label: 'Aug 1 - Aug 15', isFixedRange: true },
  '1month': { label: '1 Month', days: 30 },
  '2months': { label: '2 Months', days: 60 },
  '3months': { label: '3 Months', days: 90 },
};

export default function QuickActions() {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('15days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportPDF = async (rangeKey: DateRangeOption) => {
    try {
      setIsExporting(true);
      setIsDropdownOpen(false);
      const range = RANGE_CONFIGS[rangeKey];
      toast.info(`Fetching ${range.label} order records...`);

      const supabase = createClient();
      let query = supabase.from('orders').select('*');

      if (rangeKey === '15days') {
        // Fixed range: Aug 1 to Aug 15 of current year
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 7, 1, 0, 0, 0, 0); // Month index 7 = August
        const endDate = new Date(currentYear, 7, 15, 23, 59, 59, 999);

        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      } else {
        // Rolling relative range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (range.days || 30));
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

      // Map raw data into PDF-ready format
      const reportOrders: ReportOrder[] = rawOrders.map((o: any) => ({
        id: o.id || o.order_id || 'N/A',
        created_at: o.created_at || o.createdAt,
        customer_name:
          o.customer_name ||
          (o.first_name ? `${o.first_name} ${o.last_name || ''}`.trim() : 'Guest Customer'),
        items_summary: Array.isArray(o.items)
          ? o.items.map((i: any) => `${i.quantity || 1}x ${i.name || i.menuItem?.name || 'Item'}`).join(', ')
          : typeof o.items === 'string'
          ? o.items
          : 'Food Items',
        total_amount: Number(o.total_amount || o.totalPrice || o.total || 0),
        status: o.status || 'Completed',
      }));

      // Generate the PDF
      generateSalesReportPDF(reportOrders, {
        dateRangeLabel: range.label,
        generatedBy: 'Admin Representative',
      });

      toast.success(`${range.label} sales report generated successfully!`);
    } catch (err: any) {
      console.error('Export PDF error:', err);
      toast.error('Failed to generate PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export PDF Split Dropdown Button */}
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--admin-border)' }}
        >
          <button
            onClick={() => handleExportPDF(selectedRange)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#C8A99A',
            }}
          >
            <Icon name="ArrowDownTrayIcon" size={14} style={{ color: '#C8A99A' }} />
            {isExporting ? 'Generating...' : `Export PDF (${RANGE_CONFIGS[selectedRange].label})`}
          </button>

          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            disabled={isExporting}
            className="px-2 py-2 text-xs border-l transition-all disabled:opacity-50 hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#C8A99A',
              borderColor: 'var(--admin-border)',
            }}
            title="Select period"
          >
            <Icon name="ChevronDownIcon" size={12} style={{ color: '#C8A99A' }} />
          </button>
        </div>

        {/* Dropdown Options */}
        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
            style={{
              background: '#1A0F0A',
              border: '1px solid var(--admin-border)',
            }}
          >
            {(Object.keys(RANGE_CONFIGS) as DateRangeOption[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedRange(key);
                  handleExportPDF(key);
                }}
                className="w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors hover:bg-white/5"
                style={{
                  color: selectedRange === key ? '#D4A017' : '#C8A99A',
                  fontWeight: selectedRange === key ? 600 : 400,
                }}
              >
                <span>{RANGE_CONFIGS[key].label}</span>
                {selectedRange === key && (
                  <Icon name="CheckIcon" size={12} style={{ color: '#D4A017' }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}               