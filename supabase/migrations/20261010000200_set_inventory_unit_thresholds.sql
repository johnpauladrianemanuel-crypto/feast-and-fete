-- Persist the agreed low-stock thresholds for existing inventory items.
-- Counted pcs/kg items become low only below their threshold; zero is out.
UPDATE public.inventory_items
SET
  reorder_level = CASE
    WHEN lower(trim(unit)) IN ('pc', 'pcs', 'piece', 'pieces') THEN 5
    WHEN lower(trim(unit)) IN ('kg', 'kilogram', 'kilograms') THEN 3
    ELSE reorder_level
  END,
  status = CASE
    WHEN COALESCE(is_counted, true) = false THEN 'Not Counted'
    WHEN current_stock <= 0 THEN 'Out of Stock'
    WHEN lower(trim(unit)) IN ('pc', 'pcs', 'piece', 'pieces')
      AND current_stock < 5 THEN 'Low Stock'
    WHEN lower(trim(unit)) IN ('kg', 'kilogram', 'kilograms')
      AND current_stock < 3 THEN 'Low Stock'
    WHEN lower(trim(unit)) NOT IN ('pc', 'pcs', 'piece', 'pieces', 'kg', 'kilogram', 'kilograms')
      AND current_stock <= reorder_level THEN 'Low Stock'
    ELSE 'OK'
  END,
  last_updated = CURRENT_DATE
WHERE lower(trim(unit)) IN ('pc', 'pcs', 'piece', 'pieces', 'kg', 'kilogram', 'kilograms');
