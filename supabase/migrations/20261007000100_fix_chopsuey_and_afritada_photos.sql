UPDATE public.menu_items
SET image = CASE id
      WHEN 'item-010' THEN '/assets/images/chicken-afritada.jpg'
      WHEN 'item-024' THEN '/assets/images/chopsuey.jpg'
    END,
    image_alt = CASE id
      WHEN 'item-010' THEN 'Chicken afritada with chicken pieces, potatoes, and carrots in tomato sauce'
      WHEN 'item-024' THEN 'Filipino chopsuey stir-fried with cabbage, carrots, cauliflower, and green beans'
    END
WHERE id IN ('item-010', 'item-024');
