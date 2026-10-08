UPDATE public.menu_items
SET image = CASE id
      WHEN 'item-015' THEN '/assets/images/seafood-kare-kare.jpg'
      WHEN 'item-017' THEN '/assets/images/baked-macaroni.jpg'
    END,
    image_alt = CASE id
      WHEN 'item-015' THEN 'Seafood kare-kare with shrimp, crab, mussels, squid, and vegetables in peanut sauce'
      WHEN 'item-017' THEN 'Filipino-style baked macaroni in a foil tray with a golden cheese topping'
    END
WHERE id IN ('item-015', 'item-017');

UPDATE public.menu_items
SET serving_size = CASE id
      WHEN 'item-025' THEN 'Per Container'
      WHEN 'item-028' THEN 'Per Glass'
    END
WHERE id IN ('item-025', 'item-028');
