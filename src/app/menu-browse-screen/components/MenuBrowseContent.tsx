'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { fetchMenuItems, fetchAllMenuItemRatings, fetchCategories, MenuItemRatingSummary, MenuItem, Category } from '@/lib/supabase/services';
import MenuGrid from './MenuGrid';
import MenuFilters from './MenuFilters';
import MenuSearch from './MenuSearch';
import Icon from '@/components/ui/AppIcon';
import MenuItemDetailModal from './MenuItemDetailModal';

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
    // Staggered header entrance
    const t1 = setTimeout(() => setHeaderVisible(true), 80);
    const t2 = setTimeout(() => setFiltersVisible(true), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    Promise.all([
      fetchMenuItems().then(items => items.filter(i => i.isActive)),
      fetchAllMenuItemRatings(),
      fetchCategories(),
    ])
      .then(([items, ratings, cats]) => {
        setMenuItems(items);
        setRatingsMap(ratings);
        setCategories(cats);
      })
      .catch(() => {
        // On error, leave empty — show empty state
        setMenuItems([]);
      })
      .finally(() => setLoading(false));
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

  // Map MenuItem (services) to the shape MenuGrid/MenuItemCard expects
  const mappedItems = filteredItems.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    categorySlug: item.categorySlug,
    description: item.description,
    price: item.price,
    servingSize: item.servingSize,
    image: item.image,
    imageAlt: item.imageAlt,
    isActive: item.isActive,
    stock: item.stock,
    soldCount: item.soldCount,
    featured: item.featured,
  }));

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-8">
      {/* Page Header — animated entrance */}
      <div
        className="mb-6"
        style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(-16px)',
          transition: 'opacity 500ms cubic-bezier(0.22,1,0.36,1), transform 500ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground">Our Menu</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pre-order authentic Filipino food trays for pickup or delivery. Order by 12 noon for next-day service.
        </p>
      </div>

      {/* Search + Sort bar */}
      <div
        className="flex flex-col sm:flex-row gap-3 mb-6"
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
            className="input-field w-auto text-sm py-2 pr-8 cursor-pointer"
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
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between mt-5 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{activeCategoryName}</h2>
          {!loading && (
            <span className="text-sm text-muted-foreground animate-fade-in">
              ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
            </span>
          )}
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Icon name="XMarkIcon" size={12} />
            Clear search
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{
                animationDelay: `${i * 60}ms`,
                animation: 'skeletonPulse 1.6s ease-in-out infinite',
                height: '288px',
                background: 'linear-gradient(90deg, var(--muted) 25%, var(--border) 50%, var(--muted) 75%)',
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && <MenuGrid items={mappedItems} searchQuery={searchQuery} ratingsMap={ratingsMap} onOpenDetail={item => setSelectedItem(item as unknown as MenuItem)} />}

      {/* Item Detail Modal */}
      <MenuItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        ratingSummary={selectedItem ? ratingsMap[selectedItem.id] : undefined}
      />
    </div>
  );
}