'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { fetchMenuItems, fetchAllMenuItemRatings, fetchCategories, MenuItemRatingSummary, MenuItem, Category } from '@/lib/supabase/services';
import { createClient } from '@/lib/supabase/client';
import MenuGrid from './MenuGrid';
import MenuFilters from './MenuFilters';
import MenuSearch from './MenuSearch';
import Icon from '@/components/ui/AppIcon';
import MenuItemDetailModal from './MenuItemDetailModal';

const CHICKEN_AFRITADA_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Chicken_Afritada%2C_Mar_2024.jpg';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'sold-desc';

export default function MenuBrowseContent() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingsMap, setRatingsMap] = useState<Record<string, MenuItemRatingSummary>>({});
  const [headerVisible, setHeaderVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setHeaderVisible(true), 80);
    const t2 = setTimeout(() => setFiltersVisible(true), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    Promise.all([
      fetchMenuItems(),
      fetchAllMenuItemRatings(),
      fetchCategories(),
    ])
      .then(([items, ratings, cats]) => {
        setMenuItems(items);
        setRatingsMap(ratings);
        setCategories(cats);
      })
      .catch(() => {
        setMenuItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('menu_items_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        async () => {
          try {
            const updatedItems = await fetchMenuItems();
            setMenuItems(updatedItems);
          } catch (err) {
            console.error('Failed to sync menu items realtime:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredItems = useMemo(() => {
    let items = [...menuItems];

    if (activeCategory !== 'all') {
      items = items.filter(i => i.categorySlug === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'price-asc':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'sold-desc':
        items.sort((a, b) => b.soldCount - a.soldCount);
        break;
      case 'featured':
      default:
        items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return items;
  }, [activeCategory, searchQuery, sortBy, menuItems]);

  const activeCategoryName =
    activeCategory === 'all' ? 'All Items'
      : categories.find(c => c.slug === activeCategory)?.name ?? 'Items';

  const mappedItems = filteredItems.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    categorySlug: item.categorySlug,
    description: item.description,
    price: item.price,
    servingSize: item.servingSize,
    image: item.id === 'item-010' || item.name.toLowerCase() === 'chicken afritada' ? CHICKEN_AFRITADA_IMAGE : item.image,
    imageAlt: item.id === 'item-010' || item.name.toLowerCase() === 'chicken afritada'
      ? 'Chicken Afritada with chicken pieces, carrots, potatoes, and tomato sauce'
      : item.imageAlt,
    ingredients: item.ingredients,
    isActive: item.isActive,
    unavailableReason: item.unavailableReason,
    stock: item.stock,
    soldCount: item.soldCount,
    featured: item.featured,
  }));

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6 md:py-8">
      {/* Page Header */}
      <div
        className="mb-6"
        style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(-16px)',
          transition: 'opacity 500ms cubic-bezier(0.22,1,0.36,1), transform 500ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">Our Menu</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base max-w-2xl">
          Pre-order authentic Filipino food trays for pickup or delivery. Order by 12 noon for next-day service.
        </p>
      </div>

      {/* Sticky Search & Filter Header Container */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-2 pb-4 border-b border-border/40 -mx-4 px-4 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10 2xl:-mx-16 2xl:px-16 transition-all">
        {/* Search + Sort bar */}
        <div
          className="flex flex-col sm:flex-row gap-3 mb-4"
          style={{
            opacity: filtersVisible ? 1 : 0,
            transform: filtersVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 450ms cubic-bezier(0.22,1,0.36,1), transform 450ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <MenuSearch value={searchQuery} onChange={setSearchQuery} />
          <div className="flex items-center gap-2 flex-shrink-0">
            <Icon name="AdjustmentsHorizontalIcon" size={16} className="text-muted-foreground" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="input-field w-full sm:w-auto text-sm py-2 pr-8 cursor-pointer bg-card font-medium"
              aria-label="Sort menu items"
            >
              <option value="featured">Featured First</option>
              <option value="sold-desc">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            opacity: filtersVisible ? 1 : 0,
            transform: filtersVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 450ms cubic-bezier(0.22,1,0.36,1) 60ms, transform 450ms cubic-bezier(0.22,1,0.36,1) 60ms',
          }}
        >
          <MenuFilters
            categories={categories}
            totalItemsCount={menuItems.length}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between mt-6 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground tracking-tight">{activeCategoryName}</h2>
          {!loading && (
            <span className="text-xs md:text-sm font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-lg"
          >
            <Icon name="XMarkIcon" size={14} />
            Clear search
          </button>
        )}
      </div>

      {/* UI Skeleton Loading Grid */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-[380px] justify-between p-4"
              style={{
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div
                className="w-full h-48 rounded-xl bg-muted animate-pulse mb-3"
                style={{
                  background: 'linear-gradient(90deg, var(--muted) 25%, var(--border) 50%, var(--muted) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'skeletonPulse 1.6s ease-in-out infinite',
                }}
              />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-muted rounded-md w-3/4 animate-pulse" />
                <div className="h-3.5 bg-muted rounded-md w-full animate-pulse" />
                <div className="h-3.5 bg-muted rounded-md w-2/3 animate-pulse" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="h-6 bg-muted rounded-md w-20 animate-pulse" />
                <div className="h-9 bg-muted rounded-xl w-28 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <MenuGrid
          items={mappedItems}
          searchQuery={searchQuery}
          ratingsMap={ratingsMap}
          onOpenDetail={item => setSelectedItem(item as unknown as MenuItem)}
          onResetSearch={() => setSearchQuery('')}
        />
      )}

      {/* Item Detail Modal */}
      <MenuItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        ratingSummary={selectedItem ? ratingsMap[selectedItem.id] : undefined}
      />
    </div>
  );
}