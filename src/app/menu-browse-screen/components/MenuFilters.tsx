'use client';
import React, { useRef } from 'react';
import { Category } from '@/lib/supabase/services';
import Icon from '@/components/ui/AppIcon';

interface Props {
  categories: Category[];
  totalItemsCount?: number;
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

// Mapping ng mga category slugs papunta sa mga malilinis na vector icons
const CATEGORY_ICONS: Record<string, string> = {
  all: 'Squares2X2Icon',
  beef: 'FireIcon',
  pork: 'FireIcon',
  chicken: 'ShoppingBagIcon',
  seafood: 'SparklesIcon',
  pasta: 'CakeIcon',
  vegetables: 'SparklesIcon',
  desserts: 'CakeIcon',
  packages: 'GiftIcon',
};

export default function MenuFilters({ categories, totalItemsCount = 0, activeCategory, onCategoryChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const allTab = { id: 'cat-all', name: 'All', slug: 'all', itemCount: totalItemsCount };
  const tabs = [allTab, ...categories];

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-none pb-1 pt-1 no-scrollbar"
        role="tablist"
        aria-label="Filter by food category"
        style={{
          maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
        }}
      >
        {tabs.map(cat => {
          const isActive = activeCategory === cat.slug;
          const iconName = CATEGORY_ICONS[cat.slug] || 'UtensilsIcon';

          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(cat.slug)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 active:scale-95"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #7B1C2E 0%, #9B2C3E 100%)'
                  : 'var(--card)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: isActive ? 'none' : '1.5px solid var(--border)',
                boxShadow: isActive ? '0 4px 14px rgba(123,28,46,0.28)' : 'none',
                transform: isActive ? 'translateY(-1px)' : 'none',
              }}
            >
              <Icon
                name={iconName}
                size={16}
                className={isActive ? 'text-white' : 'text-foreground'}
              />
              <span>{cat.name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--muted)',
                  color: isActive ? 'white' : 'var(--muted-foreground)',
                }}
              >
                {cat.itemCount ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}