UPDATE public.menu_items
SET price = 60,
    serving_size = 'Per Bottle'
WHERE category_slug = 'drinks';

UPDATE public.menu_items
SET image = CASE id
      WHEN 'item-025' THEN '/assets/images/drinks/buko-pandan.jpg'
      WHEN 'item-026' THEN '/assets/images/drinks/sago-gulaman.jpg'
      WHEN 'item-027' THEN '/assets/images/drinks/calamansi-drink.jpg'
      WHEN 'item-028' THEN '/assets/images/drinks/salabat.jpg'
    END,
    image_alt = CASE id
      WHEN 'item-025' THEN 'Buko pandan with young coconut strips and pandan jelly'
      WHEN 'item-026' THEN 'Filipino sago at gulaman drink with tapioca pearls and jelly'
      WHEN 'item-027' THEN 'Fresh calamansi drink served chilled with mint'
      WHEN 'item-028' THEN 'Traditional Filipino ginger tea known as salabat'
    END
WHERE id IN ('item-025', 'item-026', 'item-027', 'item-028');
