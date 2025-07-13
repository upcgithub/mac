-- =============================================
-- DATOS DE PRUEBA PARA SISTEMA DE PEDIDOS - MAC SHOP
-- =============================================
-- Este script inserta datos de ejemplo para probar la funcionalidad de pedidos
-- Usando datos reales del usuario Juan Juan:
-- user_id: ff363d35-8366-4fbe-aa97-e0d60ccad2f3
-- email: juan@gmail.com
-- full_name: Juan Juan
-- phone: +51943575436

-- =============================================
-- 1. INSERTAR PEDIDOS DE EJEMPLO
-- =============================================

-- Pedido 1: ENTREGADO (hace 2 semanas)
INSERT INTO public.orders (
  user_id, order_number, customer_email, customer_first_name, customer_last_name, customer_phone,
  shipping_address_line_1, shipping_city, shipping_state, shipping_postal_code, shipping_country,
  payment_method, payment_status, subtotal, shipping_cost, total_amount, status,
  created_at, tracking_number, actual_delivery_date
) VALUES (
  'ff363d35-8366-4fbe-aa97-e0d60ccad2f3', -- Juan Juan user_id
  'UF1752364904001',
  'juan@gmail.com',
  'Juan',
  'Juan',
  '+51943575436',
  'Av. La Brasil 2199, Departamento 1002',
  'Lima',
  'Lima',
  '15072',
  'Perú',
  'card',
  'paid',
  135.00,
  15.00,
  150.00,
  'delivered',
  NOW() - INTERVAL '14 days',
  'DHL123456789PE',
  NOW() - INTERVAL '10 days'
);

-- Pedido 2: ENTREGADO (hace 1 mes)
INSERT INTO public.orders (
  user_id, order_number, customer_email, customer_first_name, customer_last_name, customer_phone,
  shipping_address_line_1, shipping_city, shipping_state, shipping_postal_code, shipping_country,
  payment_method, payment_status, subtotal, discount_amount, discount_code, discount_percentage, shipping_cost, total_amount, status,
  created_at, tracking_number, actual_delivery_date
) VALUES (
  'ff363d35-8366-4fbe-aa97-e0d60ccad2f3', -- Juan Juan user_id
  'UF1752364904002',
  'juan@gmail.com',
  'Juan',
  'Juan',
  '+51943575436',
  'Av. La Brasil 2199, Departamento 1002',
  'Lima',
  'Lima',
  '15072',
  'Perú',
  'paypal',
  'paid',
  180.00,
  18.00,
  'DESCUENTO10',
  10,
  12.00,
  174.00,
  'delivered',
  NOW() - INTERVAL '30 days',
  'FEDEX987654321PE',
  NOW() - INTERVAL '26 days'
);

-- Pedido 3: EN TRÁNSITO (enviado hace 3 días)
INSERT INTO public.orders (
  user_id, order_number, customer_email, customer_first_name, customer_last_name, customer_phone,
  shipping_address_line_1, shipping_city, shipping_state, shipping_postal_code, shipping_country,
  payment_method, payment_status, subtotal, shipping_cost, total_amount, status,
  created_at, tracking_number, estimated_delivery_date
) VALUES (
  'ff363d35-8366-4fbe-aa97-e0d60ccad2f3', -- Juan Juan user_id
  'UF1752364904003',
  'juan@gmail.com',
  'Juan',
  'Juan',
  '+51943575436',
  'Av. La Brasil 2199, Departamento 1002',
  'Lima',
  'Lima',
  '15072',
  'Perú',
  'card',
  'paid',
  89.00,
  10.00,
  99.00,
  'shipped',
  NOW() - INTERVAL '5 days',
  'UPS555666777PE',
  NOW() + INTERVAL '2 days'
);

-- Pedido 4: PROCESANDO (confirmado hace 1 día)
INSERT INTO public.orders (
  user_id, order_number, customer_email, customer_first_name, customer_last_name, customer_phone,
  shipping_address_line_1, shipping_city, shipping_state, shipping_postal_code, shipping_country,
  payment_method, payment_status, subtotal, shipping_cost, total_amount, status,
  created_at, estimated_delivery_date
) VALUES (
  'ff363d35-8366-4fbe-aa97-e0d60ccad2f3', -- Juan Juan user_id
  'UF1752364904004',
  'juan@gmail.com',
  'Juan',
  'Juan',
  '+51943575436',
  'Av. La Brasil 2199, Departamento 1002',
  'Lima',
  'Lima',
  '15072',
  'Perú',
  'card',
  'paid',
  65.00,
  8.00,
  73.00,
  'processing',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '7 days'
);

-- Pedido 5: CONFIRMADO (recién creado)
INSERT INTO public.orders (
  user_id, order_number, customer_email, customer_first_name, customer_last_name, customer_phone,
  shipping_address_line_1, shipping_city, shipping_state, shipping_postal_code, shipping_country,
  payment_method, payment_status, subtotal, shipping_cost, total_amount, status,
  created_at, estimated_delivery_date
) VALUES (
  'ff363d35-8366-4fbe-aa97-e0d60ccad2f3', -- Juan Juan user_id
  'UF1752364904005',
  'juan@gmail.com',
  'Juan',
  'Juan',
  '+51943575436',
  'Av. La Brasil 2199, Departamento 1002',
  'Lima',
  'Lima',
  '15072',
  'Perú',
  'card',
  'paid',
  120.00,
  15.00,
  135.00,
  'confirmed',
  NOW(),
  NOW() + INTERVAL '10 days'
);

-- =============================================
-- 2. INSERTAR ITEMS DE PEDIDOS
-- =============================================

-- Items para Pedido 1 (ENTREGADO)
INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_type, product_variant, unit_price, quantity, total_price) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904001'), 'kaws-hoodie', 'KAWS CONTEMPORARY COLLECTION - Sudadera', '/assets/images/products/kaws/hoodie/front.jpg', 'Hoodie', 'Talla: L', 45.00, 3, 135.00);

-- Items para Pedido 2 (ENTREGADO)
INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_type, product_variant, unit_price, quantity, total_price) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904002'), 'damien-hirst-tshirt', 'DAMIEN HIRST - Camiseta Artística', '/assets/images/products/damien-hirst/t-shirt/front.jpg', 'T-Shirt', 'Talla: M', 35.00, 2, 70.00),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904002'), 'andy-warhol-poster', 'ANDY WARHOL - Póster Colección', '/assets/images/products/andy-warhol/poster/front.jpg', 'Poster', '50x70 cm', 25.00, 1, 25.00),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904002'), 'abstraktes-bild-mug', 'ABSTRAKTES BILD - Taza de Cerámica', '/assets/images/products/abstraktes-bild/mug/front.jpg', 'Mug', 'Cerámica 350ml', 18.00, 1, 18.00),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904002'), 'kaws-canvas', 'KAWS - Lienzo Artístico', '/assets/images/products/kaws/canvas/front.jpg', 'Canvas', '40x60 cm', 67.00, 1, 67.00);

-- Items para Pedido 3 (EN TRÁNSITO)
INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_type, product_variant, unit_price, quantity, total_price) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904003'), 'nina-con-globo-sweatshirt', 'NINA CON GLOBO - Sudadera Sin Capucha', '/assets/images/products/nina-con-globo/sweatshirt/front.jpg', 'Sweatshirt', 'Talla: XL', 42.00, 1, 42.00),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904003'), '20th-century-poster', '20TH CENTURY ART - Póster Vintage', '/assets/images/products/20th-century/poster/front.jpg', 'Poster', '60x80 cm', 28.00, 1, 28.00),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904003'), 'david-hockney-mug', 'DAVID HOCKNEY - Taza Artística', '/assets/images/placeholder.jpg', 'Mug', 'Cerámica Premium', 19.00, 1, 19.00);

-- Items para Pedido 4 (PROCESANDO)
INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_type, product_variant, unit_price, quantity, total_price) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904004'), 'kaws-tshirt', 'KAWS CONTEMPORARY - Camiseta', '/assets/images/products/kaws/t-shirt/front.jpg', 'T-Shirt', 'Talla: S', 32.00, 2, 64.00),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904004'), 'abstraktes-bild-poster', 'ABSTRAKTES BILD - Póster Arte Abstracto', '/assets/images/products/abstraktes-bild/poster/front.jpg', 'Poster', '30x40 cm', 22.00, 1, 22.00);

-- Items para Pedido 5 (CONFIRMADO)
INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_type, product_variant, unit_price, quantity, total_price) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904005'), 'damien-hirst-hoodie', 'DAMIEN HIRST - Sudadera con Capucha', '/assets/images/products/damien-hirst/hoodie/front.jpg', 'Hoodie', 'Talla: L', 48.00, 1, 48.00),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904005'), 'andy-warhol-canvas', 'ANDY WARHOL - Lienzo Pop Art', '/assets/images/products/andy-warhol/canvas/front.jpg', 'Canvas', '50x70 cm', 72.00, 1, 72.00);

-- =============================================
-- 3. INSERTAR HISTORIAL DE ESTADOS
-- =============================================

-- Historial para Pedido 1 (ENTREGADO)
INSERT INTO public.order_status_history (order_id, status, status_message, created_at) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904001'), 'confirmed', 'Pedido confirmado y recibido', NOW() - INTERVAL '14 days'),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904001'), 'processing', 'Pedido en proceso de preparación', NOW() - INTERVAL '13 days'),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904001'), 'shipped', 'Pedido enviado', NOW() - INTERVAL '12 days'),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904001'), 'delivered', 'Pedido entregado exitosamente', NOW() - INTERVAL '10 days');

-- Historial para Pedido 2 (ENTREGADO)
INSERT INTO public.order_status_history (order_id, status, status_message, tracking_number, carrier, created_at) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904002'), 'confirmed', 'Pedido confirmado y recibido', 'FEDEX987654321PE', 'FedEx', NOW() - INTERVAL '30 days'),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904002'), 'processing', 'Pedido en proceso de preparación', 'FEDEX987654321PE', 'FedEx', NOW() - INTERVAL '29 days'),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904002'), 'shipped', 'Pedido enviado con descuento aplicado', 'FEDEX987654321PE', 'FedEx', NOW() - INTERVAL '28 days'),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904002'), 'delivered', 'Pedido entregado exitosamente', 'FEDEX987654321PE', 'FedEx', NOW() - INTERVAL '26 days');

-- Historial para Pedido 3 (EN TRÁNSITO)
INSERT INTO public.order_status_history (order_id, status, status_message, tracking_number, carrier, created_at) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904003'), 'confirmed', 'Pedido confirmado y recibido', 'UPS555666777PE', 'UPS', NOW() - INTERVAL '5 days'),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904003'), 'processing', 'Pedido en proceso de preparación', 'UPS555666777PE', 'UPS', NOW() - INTERVAL '4 days'),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904003'), 'shipped', 'Pedido enviado - En tránsito', 'UPS555666777PE', 'UPS', NOW() - INTERVAL '3 days');

-- Historial para Pedido 4 (PROCESANDO)
INSERT INTO public.order_status_history (order_id, status, status_message, created_at) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904004'), 'confirmed', 'Pedido confirmado y recibido', NOW() - INTERVAL '1 day'),
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904004'), 'processing', 'Pedido en proceso de preparación', NOW() - INTERVAL '12 hours');

-- Historial para Pedido 5 (CONFIRMADO)
INSERT INTO public.order_status_history (order_id, status, status_message, created_at) VALUES 
((SELECT id FROM public.orders WHERE order_number = 'UF1752364904005'), 'confirmed', 'Pedido confirmado y recibido', NOW());

-- =============================================
-- 4. VERIFICAR DATOS INSERTADOS
-- =============================================

-- Consulta para verificar pedidos creados
SELECT 
  order_number,
  customer_first_name,
  customer_last_name,
  status,
  total_amount,
  created_at,
  tracking_number
FROM public.orders 
WHERE user_id = 'ff363d35-8366-4fbe-aa97-e0d60ccad2f3'
ORDER BY created_at DESC;

-- Consulta para verificar items de pedidos
SELECT 
  o.order_number,
  oi.product_name,
  oi.product_type,
  oi.quantity,
  oi.total_price
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.user_id = 'ff363d35-8366-4fbe-aa97-e0d60ccad2f3'
ORDER BY o.created_at DESC, oi.product_name;

-- Consulta para verificar historial de estados
SELECT 
  o.order_number,
  osh.status,
  osh.status_message,
  osh.tracking_number,
  osh.carrier,
  osh.created_at
FROM public.order_status_history osh
JOIN public.orders o ON osh.order_id = o.id
WHERE o.user_id = 'ff363d35-8366-4fbe-aa97-e0d60ccad2f3'
ORDER BY o.order_number, osh.created_at;

-- =============================================
-- INSTRUCCIONES DE USO:
-- =============================================
-- 1. Este script ya está configurado para el usuario Juan Juan:
--    - user_id: ff363d35-8366-4fbe-aa97-e0d60ccad2f3
--    - email: juan@gmail.com
--    - Nombre: Juan Juan
--    - Teléfono: +51943575436
--
-- 2. Ejecuta este script en el SQL Editor de Supabase
--
-- 3. Verifica que los datos se insertaron correctamente con las consultas al final
--
-- 4. Ahora podrás ver pedidos entregados en tu aplicación:
--    - 2 pedidos entregados (UF1752364904001 y UF1752364904002)
--    - 1 pedido en tránsito (UF1752364904003)
--    - 1 pedido procesando (UF1752364904004)
--    - 1 pedido confirmado (UF1752364904005)
--
-- ============================================= 