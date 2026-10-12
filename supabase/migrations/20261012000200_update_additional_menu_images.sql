UPDATE public.menu_items
SET image = CASE id
      WHEN 'item-015' THEN '/assets/images/Food/Seafood%20Kare-Kare.jpg'
      WHEN 'item-024' THEN '/assets/images/Food/Chopsuey%20Filipino-Style.webp'
      WHEN 'item-026' THEN '/assets/images/Food/Sago''t%20Gulaman.jpg'
      WHEN 'item-027' THEN '/assets/images/Food/Calamansi%20Juice%20Pitcher.jpg'
      WHEN 'item-028' THEN '/assets/images/Food/Iced%20Salabat%20(Ginger%20Tea).jpg'
    END,
    image_alt = CASE id
      WHEN 'item-015' THEN 'Seafood Kare-Kare with mixed seafood in peanut sauce and vegetables'
      WHEN 'item-024' THEN 'Filipino Chopsuey stir-fried vegetables with quail eggs in oyster sauce'
      WHEN 'item-026' THEN 'Sago at Gulaman Filipino sweet drink with tapioca pearls and jelly'
      WHEN 'item-027' THEN 'Fresh calamansi juice served chilled'
      WHEN 'item-028' THEN 'Iced Filipino ginger tea known as salabat'
    END
WHERE id IN ('item-015', 'item-024', 'item-026', 'item-027', 'item-028');
