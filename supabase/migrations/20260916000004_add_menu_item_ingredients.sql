-- Store menu ingredients separately so admins can edit them independently.

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS ingredients TEXT NOT NULL DEFAULT '';

UPDATE public.menu_items AS menu
SET ingredients = ingredients_data.ingredients
FROM (VALUES
  ('item-001', 'oxtail, tripe, peanut butter, eggplant, banana blossom, string beans, bagoong alamang, garlic, onion, and spices.'),
  ('item-002', 'beef, tomato sauce, liver spread, bell peppers, olives, potatoes, garlic, onion, and spices.'),
  ('item-003', 'beef, beef fat, tomato sauce, soy sauce, potatoes, carrots, garlic, onion, and spices.'),
  ('item-004', 'beef sirloin, soy sauce, calamansi, onions, garlic, cooking oil, and black pepper.'),
  ('item-005', 'pork belly, liver sauce, vinegar, garlic, chili, salt, and pepper.'),
  ('item-006', 'pork belly, coconut milk, vinegar, soy sauce, garlic, bay leaves, onion, and black pepper.'),
  ('item-007', 'pork ribs, tamarind, radish, eggplant, string beans, kangkong, tomatoes, onion, and fish sauce.'),
  ('item-008', 'pork knuckle, garlic, bay leaves, peppercorns, salt, and cooking oil.'),
  ('item-009', 'chicken, lemongrass, calamansi, annatto oil, garlic, ginger, vinegar, and spices.'),
  ('item-010', 'chicken, tomato sauce, potatoes, carrots, bell peppers, green peas, garlic, onion, and spices.'),
  ('item-011', 'chicken, ginger, green papaya, malunggay leaves, garlic, onion, and fish sauce.'),
  ('item-012', 'chicken thighs, soy sauce, banana ketchup, brown sugar, garlic, calamansi, and bamboo skewers.'),
  ('item-013', 'Spanish mackerel, calamansi, soy sauce, garlic, cooking oil, and sawsawan.'),
  ('item-014', 'prawns, butter, garlic, calamansi, chili, parsley, and black pepper.'),
  ('item-015', 'shrimp, squid, scallops, mussels, peanut butter, eggplant, banana blossom, string beans, and bagoong alamang.'),
  ('item-016', 'egg noodles, pork, chicken, shrimp, cabbage, carrots, snap peas, soy sauce, oyster sauce, garlic, and onion.'),
  ('item-017', 'elbow macaroni, ground beef, tomato sauce, banana ketchup, cheddar cheese, milk, butter, flour, and onions.'),
  ('item-018', 'glutinous rice, coconut milk, brown sugar, coconut cream, and salt.'),
  ('item-019', 'egg yolks, condensed milk, evaporated milk, granulated sugar, and vanilla.'),
  ('item-020', 'shaved ice, sweetened beans, jellies, kaong, macapuno, ube halaya, leche flan, ube ice cream, and evaporated milk.'),
  ('item-021', 'pork belly, chicken, egg noodles, shrimp, vegetables, soy sauce, calamansi, annatto oil, eggs, condensed milk, and evaporated milk.'),
  ('item-022', 'oxtail, tripe, peanuts, pork ribs, tamarind, chicken, tomato sauce, vegetables, glutinous rice, coconut milk, and brown sugar.'),
  ('item-023', 'ampalaya, eggplant, okra, sitaw, squash, tomatoes, bagoong alamang, garlic, and onion.'),
  ('item-024', 'cabbage, carrots, bell peppers, snap peas, cauliflower, quail eggs, oyster sauce, garlic, and onion.'),
  ('item-025', 'young coconut, pandan jelly, coconut milk, sugar, and ice.'),
  ('item-026', 'sago pearls, gulaman, brown sugar, water, and ice.'),
  ('item-027', 'calamansi juice, cane sugar, water, and ice.'),
  ('item-028', 'fresh ginger, honey, calamansi, water, and ice.')
) AS ingredients_data(id, ingredients)
WHERE menu.id = ingredients_data.id
  AND (menu.ingredients IS NULL OR menu.ingredients = '');
