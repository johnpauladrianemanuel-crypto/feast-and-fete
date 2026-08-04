'use client';
import React from 'react';

import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';

export default function QuickActions() {
  return (
    <div className="hidden md:flex items-center gap-2">
      <button
        onClick={() => toast?.info('Add Menu Item — navigate to Menu Management')}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all"
        style={{ background: 'rgba(212,160,23,0.12)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.25)' }}
      >
        <Icon name="PlusCircleIcon" size={14} style={{ color: '#D4A017' }} />
        Add Menu Item
      </button>
      <button
        onClick={() => toast?.info('Export Report — navigate to Reports section')}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#C8A99A', border: '1px solid var(--admin-border)' }}
      >
        <Icon name="ArrowDownTrayIcon" size={14} style={{ color: '#C8A99A' }} />
        Export PDF
      </button>
    </div>
  );
}