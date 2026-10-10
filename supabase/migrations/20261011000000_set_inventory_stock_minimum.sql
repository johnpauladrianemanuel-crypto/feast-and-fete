-- Set a demo baseline so every existing ingredient has at least 20 units.
-- This is sample stock and should be replaced with a physical stock count.
UPDATE public.inventory_items
SET
  current_stock = GREATEST(COALESCE(current_stock, 0), 20),
  reorder_level = LEAST(COALESCE(reorder_level, 0), 19),
  is_counted = true,
  status = 'OK',
  last_updated = CURRENT_DATE;
