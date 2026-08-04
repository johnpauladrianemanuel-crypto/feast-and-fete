-- ============================================================
-- FEAST & FÊTE — Menu Items, Inventory, Expenses, Notifications
-- ============================================================

-- ============================================================
-- 1. MENU ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  serving_size TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  image_alt TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER NOT NULL DEFAULT 0,
  sold_count INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category_slug ON public.menu_items(category_slug);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active ON public.menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON public.menu_items(featured);

-- ============================================================
-- 2. INVENTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  reorder_level NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OK',
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON public.inventory_items(status);

-- ============================================================
-- 3. EXPENSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- ============================================================
-- 4. ADMIN NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- ============================================================
-- 5. UPDATED_AT TRIGGER FOR NEW TABLES
-- ============================================================
DROP TRIGGER IF EXISTS set_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER set_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_expenses_updated_at ON public.expenses;
CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- Menu items: public read, admin write
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_menu_items" ON public.menu_items;
CREATE POLICY "public_read_menu_items"
ON public.menu_items FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_menu_items" ON public.menu_items;
CREATE POLICY "admin_manage_menu_items"
ON public.menu_items FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Inventory: admin only
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_inventory" ON public.inventory_items;
CREATE POLICY "admin_manage_inventory"
ON public.inventory_items FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Expenses: admin only
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_expenses" ON public.expenses;
CREATE POLICY "admin_manage_expenses"
ON public.expenses FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- Admin notifications: admin only
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_notifications" ON public.admin_notifications;
CREATE POLICY "admin_manage_notifications"
ON public.admin_notifications FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- ============================================================
-- 7. SEED MENU ITEMS
-- ============================================================
INSERT INTO public.menu_items (id, name, category, category_slug, description, price, serving_size, image, image_alt, is_active, stock, sold_count, featured) VALUES
('item-001','Kare-Kare sa Gata','Beef','beef','Slow-braised oxtail and tripe in a rich, creamy peanut sauce with eggplant, banana blossom, and string beans. Served with bagoong alamang on the side.',980,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_1c9882957-1765172054113.png','Kare-Kare Filipino oxtail stew in rich peanut sauce with vegetables in a large serving tray',true,15,142,true),
('item-002','Beef Caldereta Tray','Beef','beef','Tender beef chunks braised in a tomato-based sauce with liver spread, bell peppers, olives, and potatoes. Rich, hearty, and deeply savory.',850,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_1261a829f-1772976658873.png','Beef Caldereta Filipino beef stew with tomato sauce and vegetables in a large tray',true,12,98,false),
('item-003','Beef Mechado','Beef','beef','Fork-tender beef larded with fat and braised in a tangy tomato-soy sauce with potatoes and carrots. A Filipino fiesta classic.',820,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_17f92ec57-1778762102694.png','Beef Mechado Filipino braised beef in tomato sauce with potatoes served in a tray',true,10,76,false),
('item-004','Bistek Tagalog','Beef','beef','Thinly sliced beef sirloin marinated in soy sauce and calamansi, pan-fried and topped with caramelized onion rings.',780,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_145c3faa0-1777789643238.png','Bistek Tagalog Filipino beef steak with soy calamansi marinade and onion rings',true,8,63,false),
('item-005','Lechon Kawali Tray','Pork','pork','Deep-fried pork belly with impossibly crispy skin and juicy, flavorful meat inside. Served with homemade liver sauce and spiced vinegar.',920,'Good for 10–12 persons','https://img.rocket.new/generatedImages/rocket_gen_img_15b5bd873-1765211057457.png','Crispy Lechon Kawali deep-fried pork belly with golden crackling skin in a large tray',true,20,187,true),
('item-006','Pork Adobo sa Gata','Pork','pork','Classic Filipino adobo elevated with creamy coconut milk — pork belly braised in vinegar, soy sauce, garlic, and bay leaves, finished with gata.',720,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_19037c7f6-1767889464142.png','Pork Adobo sa Gata creamy coconut milk Filipino pork adobo in a serving tray',true,18,134,false),
('item-007','Pork Sinigang sa Sampaloc','Pork','pork','Sour tamarind broth with tender pork ribs, radish, eggplant, string beans, and kangkong. A comforting Filipino sour soup for the whole family.',760,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_139890192-1765172052845.png','Pork Sinigang Filipino sour tamarind soup with pork ribs and vegetables in a large bowl',true,14,156,true),
('item-008','Crispy Pata','Pork','pork','Whole pork knuckle boiled until tender then deep-fried to a perfect golden crisp. A showstopping centerpiece for any celebration.',1100,'Good for 10–12 persons','https://img.rocket.new/generatedImages/rocket_gen_img_114531f9f-1777735886981.png','Crispy Pata whole deep-fried pork knuckle with golden crispy skin plated elegantly',true,6,89,false),
('item-009','Chicken Inasal Tray','Chicken','chicken','Bacolod-style grilled chicken marinated in lemongrass, calamansi, and annatto oil. Smoky, tangy, and utterly addictive.',680,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_136898107-1772868029344.png','Chicken Inasal Bacolod-style grilled chicken with charred skin and yellow annatto color',true,25,201,true),
('item-010','Chicken Afritada','Chicken','chicken','Chicken pieces braised in a vibrant tomato-based sauce with potatoes, carrots, bell peppers, and green peas. A Filipino household staple.',620,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_1b8f554d2-1773070447030.png','Chicken Afritada Filipino chicken stew in tomato sauce with vegetables in a tray',true,22,145,false),
('item-011','Chicken Tinola','Chicken','chicken','Light ginger-based chicken soup with green papaya wedges and malunggay leaves. Nourishing, fragrant, and deeply comforting.',580,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_1d78892ff-1765736545411.png','Chicken Tinola Filipino ginger soup with green papaya and malunggay leaves',true,16,112,false),
('item-012','Chicken BBQ Skewers','Chicken','chicken','Marinated chicken thigh skewers grilled over charcoal with a sweet-savory Filipino BBQ glaze. A crowd favorite at every party.',650,'20 sticks per tray','https://img.rocket.new/generatedImages/rocket_gen_img_1d3add8b7-1767010198568.png','Filipino chicken BBQ skewers grilled on charcoal with sweet savory glaze',true,30,178,false),
('item-013','Grilled Tanigue Tray','Seafood','seafood','Fresh Spanish mackerel steaks marinated in calamansi, soy sauce, and garlic, then grilled to perfection. Served with sawsawan.',880,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_13b73a400-1783683641912.png','Grilled Tanigue Spanish mackerel fish steaks with char marks on a serving tray',true,10,67,false),
('item-014','Garlic Butter Shrimp','Seafood','seafood','Jumbo prawns sautéed in a fragrant garlic butter sauce with a hint of calamansi and chili. Rich, buttery, and irresistible.',1050,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_1280b1619-1777789643249.png','Garlic butter shrimp prawns in rich golden butter sauce with fresh herbs',true,8,93,true),
('item-015','Seafood Kare-Kare','Seafood','seafood','A luxurious version of the classic — mixed seafood (shrimp, squid, scallops, mussels) in a velvety peanut sauce with fresh vegetables.',1150,'Good for 10–12 persons','https://img.rocket.new/generatedImages/rocket_gen_img_1c9882957-1765172054113.png','Seafood Kare-Kare with mixed seafood in peanut sauce with vegetables',true,7,54,false),
('item-016','Pancit Canton Guisado','Pasta & Noodles','pasta','Stir-fried egg noodles with pork, chicken, shrimp, cabbage, carrots, and snap peas in a savory soy-oyster sauce. A Filipino birthday staple.',520,'Good for 10–12 persons','https://img.rocket.new/generatedImages/rocket_gen_img_189d7df16-1777650716606.png','Pancit Canton Guisado Filipino stir-fried egg noodles with pork shrimp and vegetables',true,20,165,false),
('item-017','Baked Macaroni Filipino-Style','Pasta & Noodles','pasta','Elbow macaroni in a sweet Filipino-style Bolognese topped with creamy béchamel sauce and baked until golden. Kids and adults love it equally.',580,'Good for 10–12 persons','https://images.unsplash.com/photo-1718395011394-1c9ad4d1d47b','Filipino-style baked macaroni with sweet meat sauce and golden creamy topping',true,18,132,false),
('item-018','Biko sa Latik','Desserts','desserts','Traditional Filipino sticky rice cake made with glutinous rice, brown sugar, and coconut milk, topped with caramelized latik (coconut curds).',420,'Good for 10–15 persons','https://img.rocket.new/generatedImages/rocket_gen_img_114b3ef28-1773906114927.png','Biko sa Latik Filipino sticky rice cake topped with golden caramelized coconut curds',true,25,148,false),
('item-019','Leche Flan Premium','Desserts','desserts','Silky-smooth steamed custard made with egg yolks, condensed milk, and evaporated milk, crowned with a rich amber caramel. The queen of Filipino desserts.',480,'12 individual llaneras','https://img.rocket.new/generatedImages/rocket_gen_img_1c8439ecd-1771179335894.png','Leche Flan Filipino steamed custard with amber caramel glaze in llanera molds',true,22,189,true),
('item-020','Halo-Halo Grande','Desserts','desserts','The ultimate Filipino shaved ice dessert — a colorful mix of sweetened beans, jellies, kaong, macapuno, ube halaya, leche flan, and creamy ube ice cream.',550,'Good for 8–10 persons','https://img.rocket.new/generatedImages/rocket_gen_img_155aa5945-1772384964207.png','Halo-Halo Filipino shaved ice dessert with colorful toppings and ube ice cream',true,15,97,false),
('item-021','Fiesta Package A','Packages','packages','Complete fiesta package: 1 Lechon Kawali tray + 1 Chicken Inasal tray + 1 Pancit Canton tray + 1 Leche Flan. Perfect for 25–30 guests.',2450,'Good for 25–30 persons','https://img.rocket.new/generatedImages/rocket_gen_img_1c9116f81-1764772961719.png','Fiesta Package A spread with multiple Filipino food trays arranged on a festive table',true,10,56,true),
('item-022','Handaan Package B','Packages','packages','Premium handaan package: 1 Kare-Kare tray + 1 Pork Sinigang tray + 1 Chicken Afritada tray + 1 Biko. Ideal for intimate family gatherings of 20–25.',2180,'Good for 20–25 persons','https://img.rocket.new/generatedImages/rocket_gen_img_1c9116f81-1764772961719.png','Handaan Package B with Kare-Kare Sinigang and Chicken Afritada Filipino food trays',true,8,41,false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. SEED INVENTORY ITEMS
-- ============================================================
INSERT INTO public.inventory_items (id, name, unit, current_stock, reorder_level, status, last_updated) VALUES
('inv-001','Pork Belly (kg)','kg',8,15,'Low Stock','2026-07-10'),
('inv-002','Chicken Thigh (kg)','kg',22,20,'OK','2026-07-10'),
('inv-003','Beef Oxtail (kg)','kg',4,10,'Low Stock','2026-07-09'),
('inv-004','Shrimp (kg)','kg',0,8,'Out of Stock','2026-07-09'),
('inv-005','Coconut Milk (L)','L',15,10,'OK','2026-07-10'),
('inv-006','Peanut Butter (kg)','kg',3,5,'Low Stock','2026-07-10'),
('inv-007','Glutinous Rice (kg)','kg',18,10,'OK','2026-07-10'),
('inv-008','Aluminum Trays (pcs)','pcs',45,30,'OK','2026-07-10')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. SEED EXPENSES
-- ============================================================
INSERT INTO public.expenses (id, date, category, description, amount) VALUES
('exp-001','2026-07-01','Ingredients','Wet market run — pork, beef, chicken',4800),
('exp-002','2026-07-02','Packaging','Aluminum trays and cling wrap',1200),
('exp-003','2026-07-03','Utilities','LPG tank refill x2',1900),
('exp-004','2026-07-05','Ingredients','Seafood — shrimp, squid, mussels',3600),
('exp-005','2026-07-07','Labor','Part-time kitchen helper (2 days)',1600),
('exp-006','2026-07-08','Ingredients','Spices, condiments, cooking oil',2100),
('exp-007','2026-07-09','Other','Delivery rider tip reimbursements',450)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. SEED ADMIN NOTIFICATIONS
-- ============================================================
INSERT INTO public.admin_notifications (id, type, title, message, read, created_at) VALUES
(gen_random_uuid(),'order','New Order Received','FF-2026-0704 from Roberto Lim — ₱2,210. Delivery to Pasig City.',false,NOW() - INTERVAL '10 minutes'),
(gen_random_uuid(),'payment','Payment Verified','Bank transfer confirmed for order FF-2026-0705 (Cristina Flores, ₱2,380).',false,NOW() - INTERVAL '25 minutes'),
(gen_random_uuid(),'inventory','Low Stock Alert','Pork Belly is running low — only 8 kg remaining (reorder level: 15 kg).',false,NOW() - INTERVAL '1 hour'),
(gen_random_uuid(),'inventory','Out of Stock','Shrimp (kg) is now out of stock. Garlic Butter Shrimp and Seafood Kare-Kare may be affected.',false,NOW() - INTERVAL '2 hours'),
(gen_random_uuid(),'order','Order Ready for Pickup','FF-2026-0700 (Lorena Mendoza) is ready. Customer has been notified.',true,NOW() - INTERVAL '3 hours'),
(gen_random_uuid(),'payment','Payment Pending Review','GCash payment for FF-2026-0704 (Roberto Lim) is awaiting verification.',true,NOW() - INTERVAL '4 hours'),
(gen_random_uuid(),'order','Order Cancelled','FF-2026-0699 (Emmanuel Torres) was cancelled by the customer.',true,NOW() - INTERVAL '5 hours'),
(gen_random_uuid(),'inventory','Low Stock Alert','Beef Oxtail is running low — only 4 kg remaining (reorder level: 10 kg).',true,NOW() - INTERVAL '6 hours'),
(gen_random_uuid(),'system','Daily Summary','Yesterday: 6 orders, ₱5,860 revenue, 2 deliveries, 4 pickups. Great day!',true,NOW() - INTERVAL '8 hours'),
(gen_random_uuid(),'order','New Order Received','FF-2026-0703 from Ana Reyes — ₱1,940. Pickup at 2:00 PM.',true,NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
