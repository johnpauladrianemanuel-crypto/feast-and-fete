export type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Verified' | 'Rejected';
export type PaymentMethod = 'GCash' | 'Bank Transfer' | 'Cash on Pickup';
export type DeliveryMethod = 'Pickup' | 'Delivery';
export type StockStatus = 'OK' | 'Low Stock' | 'Out of Stock';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  price: number;
  servingSize: string;
  image: string;
  imageAlt: string;
  isActive: boolean;
  stock: number;
  soldCount: number;
  featured: boolean;
  customizations?: MenuCustomization[];
}

export interface MenuCustomizationOption {
  value: string;
  label: string;
}

export interface MenuCustomization {
  id: string;
  label: string;
  options: MenuCustomizationOption[];
  defaultValue: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  deliveryFee: number;
  pickupDate: string;
  pickupTime: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  status: StockStatus;
  lastUpdated: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
}

export interface DailySalesData {
  date: string;
  revenue: number;
  orders: number;
}

export const CATEGORIES: Category[] = [
{ id: 'cat-beef', name: 'Beef', slug: 'beef', icon: '🥩', itemCount: 4 },
{ id: 'cat-pork', name: 'Pork', slug: 'pork', icon: '🐷', itemCount: 4 },
{ id: 'cat-chicken', name: 'Chicken', slug: 'chicken', icon: '🍗', itemCount: 4 },
{ id: 'cat-seafood', name: 'Seafood', slug: 'seafood', icon: '🦐', itemCount: 3 },
{ id: 'cat-pasta', name: 'Pasta & Noodles', slug: 'pasta', icon: '🍝', itemCount: 3 },
{ id: 'cat-vegetables', name: 'Vegetables', slug: 'vegetables', icon: '🥦', itemCount: 2 },
{ id: 'cat-desserts', name: 'Desserts', slug: 'desserts', icon: '🍮', itemCount: 3 },
{ id: 'cat-packages', name: 'Packages', slug: 'packages', icon: '🎁', itemCount: 3 },
{ id: 'cat-drinks', name: 'Drinks', slug: 'drinks', icon: '🥤', itemCount: 4 }];


export const MENU_ITEMS: MenuItem[] = [
{
  id: 'item-001',
  name: 'Kare-Kare sa Gata',
  category: 'Beef',
  categorySlug: 'beef',
  description: 'Slow-braised oxtail and tripe in a rich, creamy peanut sauce with eggplant, banana blossom, and string beans. Served with bagoong alamang on the side.',
  price: 980,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1c9882957-1765172054113.png",
  imageAlt: 'Kare-Kare Filipino oxtail stew in rich peanut sauce with vegetables in a large serving tray',
  isActive: true,
  stock: 15,
  soldCount: 142,
  featured: true,
  customizations: [
    {
      id: 'bagoong',
      label: 'Bagoong Preference',
      options: [
        { value: 'regular', label: 'Regular Bagoong' },
        { value: 'spicy', label: 'Spicy Bagoong' },
        { value: 'no-bagoong', label: 'Walang Bagoong' },
      ],
      defaultValue: 'regular',
    },
    {
      id: 'sauce-thickness',
      label: 'Sauce Thickness',
      options: [
        { value: 'thick', label: 'Malapot (Thick)' },
        { value: 'regular', label: 'Sakto Lang' },
        { value: 'light', label: 'Manipis (Light)' },
      ],
      defaultValue: 'regular',
    },
  ],
},
{
  id: 'item-002',
  name: 'Beef Caldereta Tray',
  category: 'Beef',
  categorySlug: 'beef',
  description: 'Tender beef chunks braised in a tomato-based sauce with liver spread, bell peppers, olives, and potatoes. Rich, hearty, and deeply savory.',
  price: 850,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1261a829f-1772976658873.png",
  imageAlt: 'Beef Caldereta Filipino beef stew with tomato sauce and vegetables in a large tray',
  isActive: true,
  stock: 12,
  soldCount: 98,
  featured: false
},
{
  id: 'item-003',
  name: 'Beef Mechado',
  category: 'Beef',
  categorySlug: 'beef',
  description: 'Fork-tender beef larded with fat and braised in a tangy tomato-soy sauce with potatoes and carrots. A Filipino fiesta classic.',
  price: 820,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_17f92ec57-1778762102694.png",
  imageAlt: 'Beef Mechado Filipino braised beef in tomato sauce with potatoes served in a tray',
  isActive: true,
  stock: 10,
  soldCount: 76,
  featured: false
},
{
  id: 'item-004',
  name: 'Bistek Tagalog',
  category: 'Beef',
  categorySlug: 'beef',
  description: 'Thinly sliced beef sirloin marinated in soy sauce and calamansi, pan-fried and topped with caramelized onion rings.',
  price: 780,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_145c3faa0-1777789643238.png",
  imageAlt: 'Bistek Tagalog Filipino beef steak with soy calamansi marinade and onion rings',
  isActive: true,
  stock: 8,
  soldCount: 63,
  featured: false
},
{
  id: 'item-005',
  name: 'Lechon Kawali Tray',
  category: 'Pork',
  categorySlug: 'pork',
  description: 'Deep-fried pork belly with impossibly crispy skin and juicy, flavorful meat inside. Served with homemade liver sauce and spiced vinegar.',
  price: 920,
  servingSize: 'Good for 10–12 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_15b5bd873-1765211057457.png",
  imageAlt: 'Crispy Lechon Kawali deep-fried pork belly with golden crackling skin in a large tray',
  isActive: true,
  stock: 20,
  soldCount: 187,
  featured: true
},
{
  id: 'item-006',
  name: 'Pork Adobo sa Gata',
  category: 'Pork',
  categorySlug: 'pork',
  description: 'Classic Filipino adobo elevated with creamy coconut milk — pork belly braised in vinegar, soy sauce, garlic, and bay leaves, finished with gata.',
  price: 720,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_19037c7f6-1767889464142.png",
  imageAlt: 'Pork Adobo sa Gata creamy coconut milk Filipino pork adobo in a serving tray',
  isActive: true,
  stock: 18,
  soldCount: 134,
  featured: false
},
{
  id: 'item-007',
  name: 'Pork Sinigang sa Sampaloc',
  category: 'Pork',
  categorySlug: 'pork',
  description: 'Sour tamarind broth with tender pork ribs, radish, eggplant, string beans, and kangkong. A comforting Filipino sour soup for the whole family.',
  price: 760,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_139890192-1765172052845.png",
  imageAlt: 'Pork Sinigang Filipino sour tamarind soup with pork ribs and vegetables in a large bowl',
  isActive: true,
  stock: 14,
  soldCount: 156,
  featured: true,
  customizations: [
    {
      id: 'sourness',
      label: 'Antas ng Asim (Sourness Level)',
      options: [
        { value: 'mild', label: 'Konting Asim (Mild)' },
        { value: 'medium', label: 'Sakto Lang (Medium)' },
        { value: 'sour', label: 'Maasim (Sour)' },
        { value: 'extra-sour', label: 'Super Maasim (Extra Sour)' },
      ],
      defaultValue: 'medium',
    },
    {
      id: 'spice',
      label: 'Antas ng Anghang (Spice Level)',
      options: [
        { value: 'none', label: 'Hindi Maanghang (Not Spicy)' },
        { value: 'mild', label: 'Konting Anghang (Mild)' },
        { value: 'spicy', label: 'Maanghang (Spicy)' },
      ],
      defaultValue: 'none',
    },
  ],
},
{
  id: 'item-008',
  name: 'Crispy Pata',
  category: 'Pork',
  categorySlug: 'pork',
  description: 'Whole pork knuckle boiled until tender then deep-fried to a perfect golden crisp. A showstopping centerpiece for any celebration.',
  price: 1100,
  servingSize: 'Good for 10–12 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_114531f9f-1777735886981.png",
  imageAlt: 'Crispy Pata whole deep-fried pork knuckle with golden crispy skin plated elegantly',
  isActive: true,
  stock: 6,
  soldCount: 89,
  featured: false
},
{
  id: 'item-009',
  name: 'Chicken Inasal Tray',
  category: 'Chicken',
  categorySlug: 'chicken',
  description: 'Bacolod-style grilled chicken marinated in lemongrass, calamansi, and annatto oil. Smoky, tangy, and utterly addictive.',
  price: 680,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_136898107-1772868029344.png",
  imageAlt: 'Chicken Inasal Bacolod-style grilled chicken with charred skin and yellow annatto color',
  isActive: true,
  stock: 25,
  soldCount: 201,
  featured: true
},
{
  id: 'item-010',
  name: 'Chicken Afritada',
  category: 'Chicken',
  categorySlug: 'chicken',
  description: 'Chicken pieces braised in a vibrant tomato-based sauce with potatoes, carrots, bell peppers, and green peas. A Filipino household staple.',
  price: 620,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1b8f554d2-1773070447030.png",
  imageAlt: 'Chicken Afritada Filipino chicken stew in tomato sauce with vegetables in a tray',
  isActive: true,
  stock: 22,
  soldCount: 145,
  featured: false
},
{
  id: 'item-011',
  name: 'Chicken Tinola',
  category: 'Chicken',
  categorySlug: 'chicken',
  description: 'Light ginger-based chicken soup with green papaya wedges and malunggay leaves. Nourishing, fragrant, and deeply comforting.',
  price: 580,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d78892ff-1765736545411.png",
  imageAlt: 'Chicken Tinola Filipino ginger soup with green papaya and malunggay leaves',
  isActive: true,
  stock: 16,
  soldCount: 112,
  featured: false
},
{
  id: 'item-012',
  name: 'Chicken BBQ Skewers',
  category: 'Chicken',
  categorySlug: 'chicken',
  description: 'Marinated chicken thigh skewers grilled over charcoal with a sweet-savory Filipino BBQ glaze. A crowd favorite at every party.',
  price: 650,
  servingSize: '20 sticks per tray',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d3add8b7-1767010198568.png",
  imageAlt: 'Filipino chicken BBQ skewers grilled on charcoal with sweet savory glaze',
  isActive: true,
  stock: 30,
  soldCount: 178,
  featured: false
},
{
  id: 'item-013',
  name: 'Grilled Tanigue Tray',
  category: 'Seafood',
  categorySlug: 'seafood',
  description: 'Fresh Spanish mackerel steaks marinated in calamansi, soy sauce, and garlic, then grilled to perfection. Served with sawsawan.',
  price: 880,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_13b73a400-1783683641912.png",
  imageAlt: 'Grilled Tanigue Spanish mackerel fish steaks with char marks on a serving tray',
  isActive: true,
  stock: 10,
  soldCount: 67,
  featured: false
},
{
  id: 'item-014',
  name: 'Garlic Butter Shrimp',
  category: 'Seafood',
  categorySlug: 'seafood',
  description: 'Jumbo prawns sautéed in a fragrant garlic butter sauce with a hint of calamansi and chili. Rich, buttery, and irresistible.',
  price: 1050,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1280b1619-1777789643249.png",
  imageAlt: 'Garlic butter shrimp prawns in rich golden butter sauce with fresh herbs',
  isActive: true,
  stock: 8,
  soldCount: 93,
  featured: true
},
{
  id: 'item-015',
  name: 'Seafood Kare-Kare',
  category: 'Seafood',
  categorySlug: 'seafood',
  description: 'A luxurious version of the classic — mixed seafood (shrimp, squid, scallops, mussels) in a velvety peanut sauce with fresh vegetables.',
  price: 1150,
  servingSize: 'Good for 10–12 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1c9882957-1765172054113.png",
  imageAlt: 'Seafood Kare-Kare with mixed seafood in peanut sauce with vegetables',
  isActive: true,
  stock: 7,
  soldCount: 54,
  featured: false
},
{
  id: 'item-016',
  name: 'Pancit Canton Guisado',
  category: 'Pasta & Noodles',
  categorySlug: 'pasta',
  description: 'Stir-fried egg noodles with pork, chicken, shrimp, cabbage, carrots, and snap peas in a savory soy-oyster sauce. A Filipino birthday staple.',
  price: 520,
  servingSize: 'Good for 10–12 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_189d7df16-1777650716606.png",
  imageAlt: 'Pancit Canton Guisado Filipino stir-fried egg noodles with pork shrimp and vegetables',
  isActive: true,
  stock: 20,
  soldCount: 165,
  featured: false
},
{
  id: 'item-017',
  name: 'Baked Macaroni Filipino-Style',
  category: 'Pasta & Noodles',
  categorySlug: 'pasta',
  description: 'Elbow macaroni in a sweet Filipino-style Bolognese topped with creamy béchamel sauce and baked until golden. Kids and adults love it equally.',
  price: 580,
  servingSize: 'Good for 10–12 persons',
  image: "https://images.unsplash.com/photo-1718395011394-1c9ad4d1d47b",
  imageAlt: 'Filipino-style baked macaroni with sweet meat sauce and golden creamy topping',
  isActive: true,
  stock: 18,
  soldCount: 132,
  featured: false
},
{
  id: 'item-023',
  name: 'Pinakbet Tray',
  category: 'Vegetables',
  categorySlug: 'vegetables',
  description: 'A classic Ilocano vegetable medley of ampalaya, eggplant, okra, sitaw, squash, and tomatoes sautéed in shrimp paste (bagoong). Hearty, flavorful, and nutritious.',
  price: 480,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1f55faa08-1766305905514.png",
  imageAlt: 'Pinakbet Filipino vegetable stew with ampalaya eggplant okra and squash in shrimp paste',
  isActive: true,
  stock: 20,
  soldCount: 87,
  featured: false
},
{
  id: 'item-024',
  name: 'Chopsuey Filipino-Style',
  category: 'Vegetables',
  categorySlug: 'vegetables',
  description: 'A colorful stir-fry of cabbage, carrots, bell peppers, snap peas, cauliflower, and quail eggs in a savory oyster sauce. Light, vibrant, and crowd-pleasing.',
  price: 420,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1eaaa5b92-1780641187540.png",
  imageAlt: 'Filipino Chopsuey colorful stir-fried vegetables with quail eggs in oyster sauce',
  isActive: true,
  stock: 18,
  soldCount: 64,
  featured: false
},
{
  id: 'item-018',
  name: 'Biko sa Latik',
  category: 'Desserts',
  categorySlug: 'desserts',
  description: 'Traditional Filipino sticky rice cake made with glutinous rice, brown sugar, and coconut milk, topped with caramelized latik (coconut curds).',
  price: 420,
  servingSize: 'Good for 10–15 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_114b3ef28-1773906114927.png",
  imageAlt: 'Biko sa Latik Filipino sticky rice cake topped with golden caramelized coconut curds',
  isActive: true,
  stock: 25,
  soldCount: 148,
  featured: false
},
{
  id: 'item-019',
  name: 'Leche Flan Premium',
  category: 'Desserts',
  categorySlug: 'desserts',
  description: 'Silky-smooth steamed custard made with egg yolks, condensed milk, and evaporated milk, crowned with a rich amber caramel. The queen of Filipino desserts.',
  price: 480,
  servingSize: '12 individual llaneras',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1c8439ecd-1771179335894.png",
  imageAlt: 'Leche Flan Filipino steamed custard with amber caramel glaze in llanera molds',
  isActive: true,
  stock: 22,
  soldCount: 189,
  featured: true
},
{
  id: 'item-020',
  name: 'Halo-Halo Grande',
  category: 'Desserts',
  categorySlug: 'desserts',
  description: 'The ultimate Filipino shaved ice dessert — a colorful mix of sweetened beans, jellies, kaong, macapuno, ube halaya, leche flan, and creamy ube ice cream.',
  price: 550,
  servingSize: 'Good for 8–10 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_155aa5945-1772384964207.png",
  imageAlt: 'Halo-Halo Filipino shaved ice dessert with colorful toppings and ube ice cream',
  isActive: true,
  stock: 15,
  soldCount: 97,
  featured: false
},
{
  id: 'item-021',
  name: 'Fiesta Package A',
  category: 'Packages',
  categorySlug: 'packages',
  description: 'Complete fiesta package: 1 Lechon Kawali tray + 1 Chicken Inasal tray + 1 Pancit Canton tray + 1 Leche Flan. Perfect for 25–30 guests.',
  price: 2450,
  servingSize: 'Good for 25–30 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1c9116f81-1764772961719.png",
  imageAlt: 'Fiesta Package A spread with multiple Filipino food trays arranged on a festive table',
  isActive: true,
  stock: 10,
  soldCount: 56,
  featured: true
},
{
  id: 'item-022',
  name: 'Handaan Package B',
  category: 'Packages',
  categorySlug: 'packages',
  description: 'Premium handaan package: 1 Kare-Kare tray + 1 Pork Sinigang tray + 1 Chicken Afritada tray + 1 Biko. Ideal for intimate family gatherings of 20–25.',
  price: 2180,
  servingSize: 'Good for 20–25 persons',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1c9116f81-1764772961719.png",
  imageAlt: 'Handaan Package B with Kare-Kare Sinigang and Chicken Afritada Filipino food trays',
  isActive: true,
  stock: 8,
  soldCount: 41,
  featured: false
},
{
  id: 'item-025',
  name: 'Buko Pandan Cooler',
  category: 'Drinks',
  categorySlug: 'drinks',
  description: 'Refreshing chilled drink made with young coconut strips, pandan-flavored jelly, and creamy coconut milk. A classic Filipino party cooler served in a large dispenser.',
  price: 380,
  servingSize: 'Good for 15–20 glasses',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_19037b704-1772054966698.png",
  imageAlt: 'Buko Pandan Cooler green pandan drink with coconut strips and jelly in a glass dispenser',
  isActive: true,
  stock: 30,
  soldCount: 112,
  featured: true
},
{
  id: 'item-026',
  name: 'Sago\'t Gulaman',
  category: 'Drinks',
  categorySlug: 'drinks',
  description: 'Classic Filipino street drink with chewy sago pearls, cubed gulaman (agar jelly), and sweet brown sugar syrup. Served cold in a large pitcher.',
  price: 280,
  servingSize: 'Good for 15–20 glasses',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_12b6e7cb1-1765159046806.png",
  imageAlt: 'Sago at Gulaman Filipino sweet drink with tapioca pearls and jelly in brown sugar syrup',
  isActive: true,
  stock: 35,
  soldCount: 98,
  featured: false
},
{
  id: 'item-027',
  name: 'Calamansi Juice Pitcher',
  category: 'Drinks',
  categorySlug: 'drinks',
  description: 'Freshly squeezed calamansi juice sweetened with pure cane sugar and served chilled. Bright, citrusy, and perfectly refreshing for any celebration.',
  price: 250,
  servingSize: 'Good for 15–20 glasses',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_13a7e4cd7-1765159048050.png",
  imageAlt: 'Calamansi juice pitcher with fresh calamansi citrus fruits and ice cubes',
  isActive: true,
  stock: 40,
  soldCount: 87,
  featured: false
},
{
  id: 'item-028',
  name: 'Iced Salabat (Ginger Tea)',
  category: 'Drinks',
  categorySlug: 'drinks',
  description: 'Traditional Filipino ginger tea brewed strong and served over ice with a touch of honey and calamansi. Warming, soothing, and uniquely Filipino.',
  price: 220,
  servingSize: 'Good for 15–20 glasses',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1db57f3d7-1785071944519.png",
  imageAlt: 'Iced ginger tea salabat in a glass with ice cubes and fresh ginger slices',
  isActive: true,
  stock: 25,
  soldCount: 54,
  featured: false
}];


export const MOCK_ORDERS: Order[] = [
{
  id: 'order-001',
  orderNumber: 'FF-2026-0701',
  customerId: 'cust-001',
  customerName: 'Maria Santos',
  customerPhone: '09171234567',
  customerEmail: 'maria.santos@gmail.com',
  items: [
  { id: 'oi-001a', menuItemId: 'item-005', menuItemName: 'Lechon Kawali Tray', quantity: 1, unitPrice: 920, subtotal: 920 },
  { id: 'oi-001b', menuItemId: 'item-009', menuItemName: 'Chicken Inasal Tray', quantity: 1, unitPrice: 680, subtotal: 680 }],

  totalAmount: 1650,
  deliveryMethod: 'Pickup',
  deliveryFee: 0,
  pickupDate: '2026-07-11',
  pickupTime: '10:00 AM',
  paymentMethod: 'GCash',
  paymentStatus: 'Verified',
  orderStatus: 'Confirmed',
  notes: 'Please include extra sawsawan for the Lechon Kawali.',
  createdAt: '2026-07-10T08:15:00',
  updatedAt: '2026-07-10T09:30:00'
},
{
  id: 'order-002',
  orderNumber: 'FF-2026-0702',
  customerId: 'cust-002',
  customerName: 'Juan dela Cruz',
  customerPhone: '09281234567',
  customerEmail: 'jdelacruz@yahoo.com',
  items: [
  { id: 'oi-002a', menuItemId: 'item-021', menuItemName: 'Fiesta Package A', quantity: 1, unitPrice: 2450, subtotal: 2450 }],

  totalAmount: 2650,
  deliveryMethod: 'Delivery',
  deliveryAddress: '123 Rizal St., Brgy. Poblacion, Makati City',
  deliveryFee: 200,
  pickupDate: '2026-07-12',
  pickupTime: '11:00 AM',
  paymentMethod: 'Bank Transfer',
  paymentStatus: 'Pending',
  orderStatus: 'Pending',
  notes: 'Birthday party — please deliver by 11 AM sharp.',
  createdAt: '2026-07-10T09:42:00',
  updatedAt: '2026-07-10T09:42:00'
},
{
  id: 'order-003',
  orderNumber: 'FF-2026-0703',
  customerId: 'cust-003',
  customerName: 'Ana Reyes',
  customerPhone: '09391234567',
  customerEmail: 'ana.reyes@outlook.com',
  items: [
  { id: 'oi-003a', menuItemId: 'item-001', menuItemName: 'Kare-Kare sa Gata', quantity: 1, unitPrice: 980, subtotal: 980 },
  { id: 'oi-003b', menuItemId: 'item-019', menuItemName: 'Leche Flan Premium', quantity: 2, unitPrice: 480, subtotal: 960 }],

  totalAmount: 1940,
  deliveryMethod: 'Pickup',
  deliveryFee: 0,
  pickupDate: '2026-07-10',
  pickupTime: '2:00 PM',
  paymentMethod: 'GCash',
  paymentStatus: 'Verified',
  orderStatus: 'Preparing',
  createdAt: '2026-07-09T14:20:00',
  updatedAt: '2026-07-10T07:00:00'
},
{
  id: 'order-004',
  orderNumber: 'FF-2026-0704',
  customerId: 'cust-004',
  customerName: 'Roberto Lim',
  customerPhone: '09451234567',
  customerEmail: 'roberto.lim@gmail.com',
  items: [
  { id: 'oi-004a', menuItemId: 'item-007', menuItemName: 'Pork Sinigang sa Sampaloc', quantity: 1, unitPrice: 760, subtotal: 760 },
  { id: 'oi-004b', menuItemId: 'item-014', menuItemName: 'Garlic Butter Shrimp', quantity: 1, unitPrice: 1050, subtotal: 1050 }],

  totalAmount: 1960,
  deliveryMethod: 'Delivery',
  deliveryAddress: '456 Mabini Ave., Brgy. San Antonio, Pasig City',
  deliveryFee: 250,
  pickupDate: '2026-07-10',
  pickupTime: '12:00 PM',
  paymentMethod: 'GCash',
  paymentStatus: 'Pending',
  orderStatus: 'Pending',
  createdAt: '2026-07-10T10:05:00',
  updatedAt: '2026-07-10T10:05:00'
},
{
  id: 'order-005',
  orderNumber: 'FF-2026-0705',
  customerId: 'cust-005',
  customerName: 'Cristina Flores',
  customerPhone: '09561234567',
  customerEmail: 'cristina.flores@gmail.com',
  items: [
  { id: 'oi-005a', menuItemId: 'item-022', menuItemName: 'Handaan Package B', quantity: 1, unitPrice: 2180, subtotal: 2180 }],

  totalAmount: 2380,
  deliveryMethod: 'Delivery',
  deliveryAddress: '789 Aguinaldo Blvd., Brgy. Bagong Ilog, Pasig City',
  deliveryFee: 200,
  pickupDate: '2026-07-11',
  pickupTime: '10:30 AM',
  paymentMethod: 'Bank Transfer',
  paymentStatus: 'Verified',
  orderStatus: 'Confirmed',
  notes: 'Christening celebration. Ring doorbell twice.',
  createdAt: '2026-07-09T16:30:00',
  updatedAt: '2026-07-10T08:00:00'
},
{
  id: 'order-006',
  orderNumber: 'FF-2026-0698',
  customerId: 'cust-001',
  customerName: 'Maria Santos',
  customerPhone: '09171234567',
  customerEmail: 'maria.santos@gmail.com',
  items: [
  { id: 'oi-006a', menuItemId: 'item-009', menuItemName: 'Chicken Inasal Tray', quantity: 2, unitPrice: 680, subtotal: 1360 },
  { id: 'oi-006b', menuItemId: 'item-016', menuItemName: 'Pancit Canton Guisado', quantity: 1, unitPrice: 520, subtotal: 520 }],

  totalAmount: 1880,
  deliveryMethod: 'Pickup',
  deliveryFee: 0,
  pickupDate: '2026-07-08',
  pickupTime: '11:00 AM',
  paymentMethod: 'GCash',
  paymentStatus: 'Verified',
  orderStatus: 'Completed',
  createdAt: '2026-07-07T11:00:00',
  updatedAt: '2026-07-08T12:00:00'
},
{
  id: 'order-007',
  orderNumber: 'FF-2026-0699',
  customerId: 'cust-006',
  customerName: 'Emmanuel Torres',
  customerPhone: '09671234567',
  customerEmail: 'e.torres@gmail.com',
  items: [
  { id: 'oi-007a', menuItemId: 'item-005', menuItemName: 'Lechon Kawali Tray', quantity: 1, unitPrice: 920, subtotal: 920 }],

  totalAmount: 920,
  deliveryMethod: 'Pickup',
  deliveryFee: 0,
  pickupDate: '2026-07-09',
  pickupTime: '1:00 PM',
  paymentMethod: 'Cash on Pickup',
  paymentStatus: 'Pending',
  orderStatus: 'Cancelled',
  notes: 'Customer requested cancellation.',
  createdAt: '2026-07-08T09:00:00',
  updatedAt: '2026-07-09T08:00:00'
},
{
  id: 'order-008',
  orderNumber: 'FF-2026-0700',
  customerId: 'cust-007',
  customerName: 'Lorena Mendoza',
  customerPhone: '09781234567',
  customerEmail: 'lorena.mendoza@yahoo.com',
  items: [
  { id: 'oi-008a', menuItemId: 'item-019', menuItemName: 'Leche Flan Premium', quantity: 3, unitPrice: 480, subtotal: 1440 },
  { id: 'oi-008b', menuItemId: 'item-018', menuItemName: 'Biko sa Latik', quantity: 2, unitPrice: 420, subtotal: 840 }],

  totalAmount: 2280,
  deliveryMethod: 'Delivery',
  deliveryAddress: '321 Quezon Ave., Brgy. South Triangle, Quezon City',
  deliveryFee: 300,
  pickupDate: '2026-07-10',
  pickupTime: '9:00 AM',
  paymentMethod: 'GCash',
  paymentStatus: 'Verified',
  orderStatus: 'Ready',
  createdAt: '2026-07-09T13:00:00',
  updatedAt: '2026-07-10T06:30:00'
}];


export const INVENTORY_ITEMS: InventoryItem[] = [
{ id: 'inv-001', name: 'Pork Belly (kg)', unit: 'kg', currentStock: 8, reorderLevel: 15, status: 'Low Stock', lastUpdated: '2026-07-10' },
{ id: 'inv-002', name: 'Chicken Thigh (kg)', unit: 'kg', currentStock: 22, reorderLevel: 20, status: 'OK', lastUpdated: '2026-07-10' },
{ id: 'inv-003', name: 'Beef Oxtail (kg)', unit: 'kg', currentStock: 4, reorderLevel: 10, status: 'Low Stock', lastUpdated: '2026-07-09' },
{ id: 'inv-004', name: 'Shrimp (kg)', unit: 'kg', currentStock: 0, reorderLevel: 8, status: 'Out of Stock', lastUpdated: '2026-07-09' },
{ id: 'inv-005', name: 'Coconut Milk (L)', unit: 'L', currentStock: 15, reorderLevel: 10, status: 'OK', lastUpdated: '2026-07-10' },
{ id: 'inv-006', name: 'Peanut Butter (kg)', unit: 'kg', currentStock: 3, reorderLevel: 5, status: 'Low Stock', lastUpdated: '2026-07-10' },
{ id: 'inv-007', name: 'Glutinous Rice (kg)', unit: 'kg', currentStock: 18, reorderLevel: 10, status: 'OK', lastUpdated: '2026-07-10' },
{ id: 'inv-008', name: 'Aluminum Trays (pcs)', unit: 'pcs', currentStock: 45, reorderLevel: 30, status: 'OK', lastUpdated: '2026-07-10' }];


export const MOCK_EXPENSES: Expense[] = [
{ id: 'exp-001', date: '2026-07-01', category: 'Ingredients', description: 'Wet market run — pork, beef, chicken', amount: 4800 },
{ id: 'exp-002', date: '2026-07-02', category: 'Packaging', description: 'Aluminum trays and cling wrap', amount: 1200 },
{ id: 'exp-003', date: '2026-07-03', category: 'Utilities', description: 'LPG tank refill x2', amount: 1900 },
{ id: 'exp-004', date: '2026-07-05', category: 'Ingredients', description: 'Seafood — shrimp, squid, mussels', amount: 3600 },
{ id: 'exp-005', date: '2026-07-07', category: 'Labor', description: 'Part-time kitchen helper (2 days)', amount: 1600 },
{ id: 'exp-006', date: '2026-07-08', category: 'Ingredients', description: 'Spices, condiments, cooking oil', amount: 2100 },
{ id: 'exp-007', date: '2026-07-09', category: 'Other', description: 'Delivery rider tip reimbursements', amount: 450 }];


export const MOCK_CUSTOMERS: Customer[] = [
{ id: 'cust-001', name: 'Maria Santos', email: 'maria.santos@gmail.com', phone: '09171234567', address: '12 Sampaguita St., Mandaluyong', totalOrders: 8, totalSpent: 14250, joinDate: '2025-11-15' },
{ id: 'cust-002', name: 'Juan dela Cruz', email: 'jdelacruz@yahoo.com', phone: '09281234567', address: '123 Rizal St., Makati', totalOrders: 3, totalSpent: 7800, joinDate: '2026-01-20' },
{ id: 'cust-003', name: 'Ana Reyes', email: 'ana.reyes@outlook.com', phone: '09391234567', address: '56 Luna Ave., Pasay', totalOrders: 5, totalSpent: 9650, joinDate: '2025-12-03' },
{ id: 'cust-004', name: 'Roberto Lim', email: 'roberto.lim@gmail.com', phone: '09451234567', address: '456 Mabini Ave., Pasig', totalOrders: 2, totalSpent: 3920, joinDate: '2026-04-11' },
{ id: 'cust-005', name: 'Cristina Flores', email: 'cristina.flores@gmail.com', phone: '09561234567', address: '789 Aguinaldo Blvd., Pasig', totalOrders: 4, totalSpent: 9120, joinDate: '2026-02-28' },
{ id: 'cust-006', name: 'Emmanuel Torres', email: 'e.torres@gmail.com', phone: '09671234567', address: '34 Burgos St., Mandaluyong', totalOrders: 1, totalSpent: 0, joinDate: '2026-06-05' },
{ id: 'cust-007', name: 'Lorena Mendoza', email: 'lorena.mendoza@yahoo.com', phone: '09781234567', address: '321 Quezon Ave., QC', totalOrders: 6, totalSpent: 12480, joinDate: '2025-10-22' }];


export const DAILY_SALES_DATA: DailySalesData[] = [
{ date: '06/11', revenue: 3200, orders: 3 },
{ date: '06/12', revenue: 4800, orders: 5 },
{ date: '06/13', revenue: 2100, orders: 2 },
{ date: '06/14', revenue: 5600, orders: 6 },
{ date: '06/15', revenue: 6800, orders: 7 },
{ date: '06/16', revenue: 4200, orders: 4 },
{ date: '06/17', revenue: 7800, orders: 8 },
{ date: '06/18', revenue: 3900, orders: 4 },
{ date: '06/19', revenue: 5100, orders: 5 },
{ date: '06/20', revenue: 8200, orders: 9 },
{ date: '06/21', revenue: 6500, orders: 7 },
{ date: '06/22', revenue: 4700, orders: 5 },
{ date: '06/23', revenue: 9100, orders: 10 },
{ date: '06/24', revenue: 7300, orders: 8 },
{ date: '06/25', revenue: 5800, orders: 6 },
{ date: '06/26', revenue: 3400, orders: 3 },
{ date: '06/27', revenue: 6900, orders: 7 },
{ date: '06/28', revenue: 8400, orders: 9 },
{ date: '06/29', revenue: 5200, orders: 5 },
{ date: '06/30', revenue: 7600, orders: 8 },
{ date: '07/01', revenue: 4100, orders: 4 },
{ date: '07/02', revenue: 9200, orders: 10 },
{ date: '07/03', revenue: 6300, orders: 7 },
{ date: '07/04', revenue: 4800, orders: 5 },
{ date: '07/05', revenue: 7100, orders: 8 },
{ date: '07/06', revenue: 5500, orders: 6 },
{ date: '07/07', revenue: 8800, orders: 9 },
{ date: '07/08', revenue: 6100, orders: 7 },
{ date: '07/09', revenue: 7400, orders: 8 },
{ date: '07/10', revenue: 5860, orders: 6 }];


export const TOP_ITEMS_DATA = [
{ name: 'Chicken Inasal', orders: 201 },
{ name: 'Lechon Kawali', orders: 187 },
{ name: 'Leche Flan', orders: 189 },
{ name: 'Pork Sinigang', orders: 156 },
{ name: 'Chicken Afritada', orders: 145 },
{ name: 'Biko sa Latik', orders: 148 },
{ name: 'Pancit Canton', orders: 165 },
{ name: 'Kare-Kare', orders: 142 }];