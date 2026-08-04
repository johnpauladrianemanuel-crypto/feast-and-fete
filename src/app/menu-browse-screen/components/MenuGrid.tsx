'use client';
import React from 'react';
import { MenuItem } from '@/lib/supabase/services';
import MenuItemCard from './MenuItemCard';
import Icon from '@/components/ui/AppIcon';
import { MenuItemRatingSummary } from '@/lib/supabase/services';

interface Props {
  items: MenuItem[];
  searchQuery: string;
  ratingsMap?: Record<string, MenuItemRatingSummary>;
  onOpenDetail?: (item: MenuItem) => void;
}

export default function MenuGrid({ items, searchQuery, ratingsMap, onOpenDetail }: Props) {
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center animate-fade-in"
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(212,160,23,0.1) 0%, rgba(123,28,46,0.08) 100%)',
            animation: 'emptyBounce 2s ease-in-out infinite',
          }}
        >
          <Icon name="MagnifyingGlassIcon" size={32} className="text-muted-foreground" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          No food trays found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {searchQuery
            ? `No trays match "${searchQuery}". Try searching for Kare-Kare, Lechon, Sinigang, or any Filipino dish.`
            : 'No items available in this category right now. Check back soon!'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
      {items.map((item, idx) => (
        <MenuItemCard
          key={item.id}
          item={item}
          index={idx}
          ratingSummary={ratingsMap?.[item.id]}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}