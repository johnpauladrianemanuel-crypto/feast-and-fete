'use client';
import React, { useRef } from 'react';
import { Category } from '@/lib/supabase/services';

interface Props {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

export default function MenuFilters({ categories, activeCategory, onCategoryChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const allTab = { id: 'cat-all', name: 'All', slug: 'all', icon: '🍽️', itemCount: 22 };
  const tabs = [allTab, ...categories];

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-thin pb-1"
      role="tablist"
      aria-label="Filter by food category"
    >
      {tabs.map(cat => {
        const isActive = activeCategory === cat.slug;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onCategoryChange(cat.slug)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, #7B1C2E 0%, #9B2C3E 100%)'
                : 'var(--card)',
              color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              border: isActive ? 'none' : '1.5px solid var(--border)',
              boxShadow: isActive ? '0 4px 12px rgba(123,28,46,0.25)' : 'none',
              transform: isActive ? 'translateY(-1px)' : 'none',
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--muted)',
                color: isActive ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {cat.itemCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}