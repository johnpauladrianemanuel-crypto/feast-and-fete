'use client';
import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { InventoryItem } from '@/lib/supabase/services';

interface Props {
  items: InventoryItem[];
  onDismiss: () => void;
}

export default function LowStockBanner({ items, onDismiss }: Props) {
  const outOfStock = items.filter(i => i.status === 'Out of Stock');
  const lowStock = items.filter(i => i.status === 'Low Stock');

  return (
    <div className="low-stock-banner rounded-2xl px-5 py-4 flex items-start gap-4 animate-slide-up" role="alert">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,57,43,0.15)' }}>
        <Icon name="ExclamationTriangleIcon" size={18} className="text-error" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: '#F5EDE0' }}>
          {outOfStock.length > 0
            ? `${outOfStock.length} ingredient${outOfStock.length > 1 ? 's' : ''} OUT OF STOCK — action required`
            : `${lowStock.length} ingredient${lowStock.length > 1 ? 's' : ''} running low`}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {items.map(item => (
            <span
              key={`banner-${item.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: item.status === 'Out of Stock' ? 'rgba(192,57,43,0.15)' : 'rgba(224,123,0,0.12)',
                color: item.status === 'Out of Stock' ? '#C0392B' : '#E07B00',
                border: `1px solid ${item.status === 'Out of Stock' ? 'rgba(192,57,43,0.3)' : 'rgba(224,123,0,0.25)'}`,
              }}
            >
              {item.status === 'Out of Stock' ? '🔴' : '🟡'}
              {item.name}: {item.status === 'Out of Stock' ? 'OUT' : `${item.currentStock} ${item.unit}`}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
        aria-label="Dismiss alert"
        style={{ color: 'var(--admin-muted)' }}
      >
        <Icon name="XMarkIcon" size={16} />
      </button>
    </div>
  );
}