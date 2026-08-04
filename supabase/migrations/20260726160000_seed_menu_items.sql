-- Seed all menu items and customizations into Supabase
-- This migration populates the menu_items table with all items from mockData.ts
-- and adds a customizations column to store per-item customization options.

-- 1. Add customizations column to menu_items if not exists
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT NULL;

-- 2. Seed all menu items (idempotent via ON CONFLICT)
DO $$
BEGIN
  INSERT INTO public.menu_items (id, name, category, category_slug, description, price, serving_size, image, image_alt, is_active, stock, sold_count, featured, customizations)
  VALUES
    ('item-001', 'Kare-Kare sa Gata', 'Beef', 'beef',
     'Slow-braised oxtail and tripe in a rich, creamy peanut sauce with eggplant, banana blossom, and string beans. Served with bagoong alamang on the side.',
     980, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1c9882957-1765172054113.png',
     'Kare-Kare Filipino oxtail stew in rich peanut sauce with vegetables in a large serving tray',
     true, 15, 142, true,
     '[{"id":"bagoong","label":"Bagoong Preference","options":[{"value":"regular","label":"Regular Bagoong"},{"value":"spicy","label":"Spicy Bagoong"},{"value":"no-bagoong","label":"Walang Bagoong"}],"defaultValue":"regular"},{"id":"sauce-thickness","label":"Sauce Thickness","options":[{"value":"thick","label":"Malapot (Thick)"},{"value":"regular","label":"Sakto Lang"},{"value":"light","label":"Manipis (Light)"}],"defaultValue":"regular"}]'::jsonb),

    ('item-002', 'Beef Caldereta Tray', 'Beef', 'beef',
     'Tender beef chunks braised in a tomato-based sauce with liver spread, bell peppers, olives, and potatoes. Rich, hearty, and deeply savory.',
     850, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1261a829f-1772976658873.png',
     'Beef Caldereta Filipino beef stew with tomato sauce and vegetables in a large tray',
     true, 12, 98, false, NULL),

    ('item-003', 'Beef Mechado', 'Beef', 'beef',
     'Fork-tender beef larded with fat and braised in a tangy tomato-soy sauce with potatoes and carrots. A Filipino fiesta classic.',
     820, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_17f92ec57-1778762102694.png',
     'Beef Mechado Filipino braised beef in tomato sauce with potatoes served in a tray',
     true, 10, 76, false, NULL),

    ('item-004', 'Bistek Tagalog', 'Beef', 'beef',
     'Thinly sliced beef sirloin marinated in soy sauce and calamansi, pan-fried and topped with caramelized onion rings.',
     780, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_145c3faa0-1777789643238.png',
     'Bistek Tagalog Filipino beef steak with soy calamansi marinade and onion rings',
     true, 8, 63, false, NULL),

    ('item-005', 'Lechon Kawali Tray', 'Pork', 'pork',
     'Deep-fried pork belly with impossibly crispy skin and juicy, flavorful meat inside. Served with homemade liver sauce and spiced vinegar.',
     920, 'Good for 10–12 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_15b5bd873-1765211057457.png',
     'Crispy Lechon Kawali deep-fried pork belly with golden crackling skin in a large tray',
     true, 20, 187, true, NULL),

    ('item-006', 'Pork Adobo sa Gata', 'Pork', 'pork',
     'Classic Filipino adobo elevated with creamy coconut milk — pork belly braised in vinegar, soy sauce, garlic, and bay leaves, finished with gata.',
     720, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_19037c7f6-1767889464142.png',
     'Pork Adobo sa Gata creamy coconut milk Filipino pork adobo in a serving tray',
     true, 18, 134, false, NULL),

    ('item-007', 'Pork Sinigang sa Sampaloc', 'Pork', 'pork',
     'Sour tamarind broth with tender pork ribs, radish, eggplant, string beans, and kangkong. A comforting Filipino sour soup for the whole family.',
     760, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_139890192-1765172052845.png',
     'Pork Sinigang Filipino sour tamarind soup with pork ribs and vegetables in a large bowl',
     true, 14, 156, true,
     '[{"id":"sourness","label":"Antas ng Asim (Sourness Level)","options":[{"value":"mild","label":"Konting Asim (Mild)"},{"value":"medium","label":"Sakto Lang (Medium)"},{"value":"sour","label":"Maasim (Sour)"},{"value":"extra-sour","label":"Super Maasim (Extra Sour)"}],"defaultValue":"medium"},{"id":"spice","label":"Antas ng Anghang (Spice Level)","options":[{"value":"none","label":"Hindi Maanghang (Not Spicy)"},{"value":"mild","label":"Konting Anghang (Mild)"},{"value":"spicy","label":"Maanghang (Spicy)"}],"defaultValue":"none"}]'::jsonb),

    ('item-008', 'Crispy Pata', 'Pork', 'pork',
     'Whole pork knuckle boiled until tender then deep-fried to a perfect golden crisp. A showstopping centerpiece for any celebration.',
     1100, 'Good for 10–12 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_114531f9f-1777735886981.png',
     'Crispy Pata whole deep-fried pork knuckle with golden crispy skin plated elegantly',
     true, 6, 89, false, NULL),

    ('item-009', 'Chicken Inasal Tray', 'Chicken', 'chicken',
     'Bacolod-style grilled chicken marinated in lemongrass, calamansi, and annatto oil. Smoky, tangy, and utterly addictive.',
     680, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_136898107-1772868029344.png',
     'Chicken Inasal Bacolod-style grilled chicken with charred skin and yellow annatto color',
     true, 25, 201, true, NULL),

    ('item-010', 'Chicken Afritada', 'Chicken', 'chicken',
     'Chicken pieces braised in a vibrant tomato-based sauce with potatoes, carrots, bell peppers, and green peas. A Filipino household staple.',
     620, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1b8f554d2-1773070447030.png',
     'Chicken Afritada Filipino chicken stew in tomato sauce with vegetables in a tray',
     true, 22, 145, false, NULL),

    ('item-011', 'Chicken Tinola', 'Chicken', 'chicken',
     'Light ginger-based chicken soup with green papaya wedges and malunggay leaves. Nourishing, fragrant, and deeply comforting.',
     580, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1d78892ff-1765736545411.png',
     'Chicken Tinola Filipino ginger soup with green papaya and malunggay leaves',
     true, 16, 112, false, NULL),

    ('item-012', 'Chicken BBQ Skewers', 'Chicken', 'chicken',
     'Marinated chicken thigh skewers grilled over charcoal with a sweet-savory Filipino BBQ glaze. A crowd favorite at every party.',
     650, '20 sticks per tray',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1d3add8b7-1767010198568.png',
     'Filipino chicken BBQ skewers grilled on charcoal with sweet savory glaze',
     true, 30, 178, false, NULL),

    ('item-013', 'Grilled Tanigue Tray', 'Seafood', 'seafood',
     'Fresh Spanish mackerel steaks marinated in calamansi, soy sauce, and garlic, then grilled to perfection. Served with sawsawan.',
     880, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_13b73a400-1783683641912.png',
     'Grilled Tanigue Spanish mackerel fish steaks with char marks on a serving tray',
     true, 10, 67, false, NULL),

    ('item-014', 'Garlic Butter Shrimp', 'Seafood', 'seafood',
     'Jumbo prawns sautéed in a fragrant garlic butter sauce with a hint of calamansi and chili. Rich, buttery, and irresistible.',
     1050, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1280b1619-1777789643249.png',
     'Garlic butter shrimp prawns in rich golden butter sauce with fresh herbs',
     true, 8, 93, true, NULL),

    ('item-015', 'Seafood Kare-Kare', 'Seafood', 'seafood',
     'A luxurious version of the classic — mixed seafood (shrimp, squid, scallops, mussels) in a velvety peanut sauce with fresh vegetables.',
     1150, 'Good for 10–12 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1c9882957-1765172054113.png',
     'Seafood Kare-Kare with mixed seafood in peanut sauce with vegetables',
     true, 7, 54, false, NULL),

    ('item-016', 'Pancit Canton Guisado', 'Pasta & Noodles', 'pasta',
     'Stir-fried egg noodles with pork, chicken, shrimp, cabbage, carrots, and snap peas in a savory soy-oyster sauce. A Filipino birthday staple.',
     520, 'Good for 10–12 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_189d7df16-1777650716606.png',
     'Pancit Canton Guisado Filipino stir-fried egg noodles with pork shrimp and vegetables',
     true, 20, 165, false, NULL),

    ('item-017', 'Baked Macaroni Filipino-Style', 'Pasta & Noodles', 'pasta',
     'Elbow macaroni in a sweet Filipino-style Bolognese topped with creamy bechamel sauce and baked until golden. Kids and adults love it equally.',
     580, 'Good for 10–12 persons',
     'https://images.unsplash.com/photo-1718395011394-1c9ad4d1d47b',
     'Filipino-style baked macaroni with sweet meat sauce and golden creamy topping',
     true, 18, 132, false, NULL),

    ('item-018', 'Biko sa Latik', 'Desserts', 'desserts',
     'Traditional Filipino sticky rice cake made with glutinous rice, brown sugar, and coconut milk, topped with caramelized latik (coconut curds).',
     420, 'Good for 10–15 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_114b3ef28-1773906114927.png',
     'Biko sa Latik Filipino sticky rice cake topped with golden caramelized coconut curds',
     true, 25, 148, false, NULL),

    ('item-019', 'Leche Flan Premium', 'Desserts', 'desserts',
     'Silky-smooth steamed custard made with egg yolks, condensed milk, and evaporated milk, crowned with a rich amber caramel. The queen of Filipino desserts.',
     480, '12 individual llaneras',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1c8439ecd-1771179335894.png',
     'Leche Flan Filipino steamed custard with amber caramel glaze in llanera molds',
     true, 22, 189, true, NULL),

    ('item-020', 'Halo-Halo Grande', 'Desserts', 'desserts',
     'The ultimate Filipino shaved ice dessert — a colorful mix of sweetened beans, jellies, kaong, macapuno, ube halaya, leche flan, and creamy ube ice cream.',
     550, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_155aa5945-1772384964207.png',
     'Halo-Halo Filipino shaved ice dessert with colorful toppings and ube ice cream',
     true, 15, 97, false, NULL),

    ('item-021', 'Fiesta Package A', 'Packages', 'packages',
     'Complete fiesta package: 1 Lechon Kawali tray + 1 Chicken Inasal tray + 1 Pancit Canton tray + 1 Leche Flan. Perfect for 25–30 guests.',
     2450, 'Good for 25–30 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1c9116f81-1764772961719.png',
     'Fiesta Package A spread with multiple Filipino food trays arranged on a festive table',
     true, 10, 56, true, NULL),

    ('item-022', 'Handaan Package B', 'Packages', 'packages',
     'Premium handaan package: 1 Kare-Kare tray + 1 Pork Sinigang tray + 1 Chicken Afritada tray + 1 Biko. Ideal for intimate family gatherings of 20–25.',
     2180, 'Good for 20–25 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1c9116f81-1764772961719.png',
     'Handaan Package B with Kare-Kare Sinigang and Chicken Afritada Filipino food trays',
     true, 8, 41, false, NULL),

    ('item-023', 'Pinakbet Tray', 'Vegetables', 'vegetables',
     'A classic Ilocano vegetable medley of ampalaya, eggplant, okra, sitaw, squash, and tomatoes sauteed in shrimp paste (bagoong). Hearty, flavorful, and nutritious.',
     480, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1f55faa08-1766305905514.png',
     'Pinakbet Filipino vegetable stew with ampalaya eggplant okra and squash in shrimp paste',
     true, 20, 87, false, NULL),

    ('item-024', 'Chopsuey Filipino-Style', 'Vegetables', 'vegetables',
     'A colorful stir-fry of cabbage, carrots, bell peppers, snap peas, cauliflower, and quail eggs in a savory oyster sauce. Light, vibrant, and crowd-pleasing.',
     420, 'Good for 8–10 persons',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1eaaa5b92-1780641187540.png',
     'Filipino Chopsuey colorful stir-fried vegetables with quail eggs in oyster sauce',
     true, 18, 64, false, NULL),

    ('item-025', 'Buko Pandan Cooler', 'Drinks', 'drinks',
     'Refreshing chilled drink made with young coconut strips, pandan-flavored jelly, and creamy coconut milk. A classic Filipino party cooler served in a large dispenser.',
     380, 'Good for 15–20 glasses',
     'https://img.rocket.new/generatedImages/rocket_gen_img_19037b704-1772054966698.png',
     'Buko Pandan Cooler green pandan drink with coconut strips and jelly in a glass dispenser',
     true, 30, 112, true, NULL),

    ('item-026', 'Sago''t Gulaman', 'Drinks', 'drinks',
     'Classic Filipino street drink with chewy sago pearls, cubed gulaman (agar jelly), and sweet brown sugar syrup. Served cold in a large pitcher.',
     280, 'Good for 15–20 glasses',
     'https://img.rocket.new/generatedImages/rocket_gen_img_12b6e7cb1-1765159046806.png',
     'Sago at Gulaman Filipino sweet drink with tapioca pearls and jelly in brown sugar syrup',
     true, 35, 98, false, NULL),

    ('item-027', 'Calamansi Juice Pitcher', 'Drinks', 'drinks',
     'Freshly squeezed calamansi juice sweetened with pure cane sugar and served chilled. Bright, citrusy, and perfectly refreshing for any celebration.',
     250, 'Good for 15–20 glasses',
     'https://img.rocket.new/generatedImages/rocket_gen_img_13a7e4cd7-1765159048050.png',
     'Calamansi juice pitcher with fresh calamansi citrus fruits and ice cubes',
     true, 40, 87, false, NULL),

    ('item-028', 'Iced Salabat (Ginger Tea)', 'Drinks', 'drinks',
     'Traditional Filipino ginger tea brewed strong and served over ice with a touch of honey and calamansi. Warming, soothing, and uniquely Filipino.',
     220, 'Good for 15–20 glasses',
     'https://img.rocket.new/generatedImages/rocket_gen_img_1db57f3d7-1785071944519.png',
     'Iced ginger tea salabat in a glass with ice cubes and fresh ginger slices',
     true, 25, 54, false, NULL)

  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_slug = EXCLUDED.category_slug,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    serving_size = EXCLUDED.serving_size,
    image = EXCLUDED.image,
    image_alt = EXCLUDED.image_alt,
    is_active = EXCLUDED.is_active,
    stock = EXCLUDED.stock,
    sold_count = EXCLUDED.sold_count,
    featured = EXCLUDED.featured,
    customizations = EXCLUDED.customizations;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Menu items seed failed: %', SQLERRM;
END $$;
