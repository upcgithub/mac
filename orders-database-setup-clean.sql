-- =============================================
-- ORDERS DATABASE SETUP SCRIPT - MAC SHOP (CLEAN VERSION)
-- =============================================
-- Este script crea las tablas necesarias para el sistema de pedidos y seguimiento
-- Ejecutar en Supabase SQL Editor

-- =============================================
-- 1. CREAR TABLA DE PEDIDOS (ORDERS)
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT UNIQUE NOT NULL, -- Formato: UF12345678
  
  -- Customer Information
  customer_email TEXT NOT NULL,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Shipping Address
  shipping_address_line_1 TEXT NOT NULL,
  shipping_address_line_2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  
  -- Billing Address (optional, can be same as shipping)
  billing_address_line_1 TEXT,
  billing_address_line_2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  use_same_for_billing BOOLEAN DEFAULT TRUE,
  
  -- Payment Information
  payment_method TEXT NOT NULL DEFAULT 'card', -- 'card', 'paypal', etc.
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  
  -- Order Totals
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_code TEXT,
  discount_percentage INTEGER DEFAULT 0,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Order Status
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional tracking info
  notes TEXT,
  tracking_number TEXT,
  estimated_delivery_date DATE,
  actual_delivery_date DATE
);

-- =============================================
-- 2. CREAR TABLA DE ITEMS DEL PEDIDO (ORDER_ITEMS)
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  
  -- Product Information
  product_id TEXT NOT NULL, -- ID del producto en el sistema
  product_name TEXT NOT NULL,
  product_image TEXT, -- URL de la imagen del producto
  product_type TEXT, -- 'hoodie', 't-shirt', 'poster', etc.
  product_variant TEXT, -- Talla, color, etc.
  
  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10,2) NOT NULL, -- unit_price * quantity
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. CREAR TABLA DE HISTORIAL DE ESTADO (ORDER_STATUS_HISTORY)
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  
  -- Status Information
  status TEXT NOT NULL, -- 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  status_message TEXT, -- Mensaje descriptivo del estado
  
  -- Tracking Information
  tracking_number TEXT,
  carrier TEXT, -- 'DHL', 'FedEx', 'UPS', etc.
  tracking_url TEXT,
  
  -- Location Information
  current_location TEXT,
  estimated_delivery TEXT,
  
  -- Additional Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) -- Quién actualizó el estado (admin o sistema)
);

-- =============================================
-- 4. CREAR ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

-- =============================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. CREAR POLÍTICAS DE SEGURIDAD
-- =============================================

-- Políticas para ORDERS
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para ORDER_ITEMS
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Políticas para ORDER_STATUS_HISTORY
CREATE POLICY "Users can view own order status history" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_status_history.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert order status history" ON public.order_status_history
  FOR INSERT WITH CHECK (true); -- Permitir inserciones del sistema

-- =============================================
-- 7. CREAR FUNCIONES PARA AUTOMATIZACIÓN
-- =============================================

-- Función para actualizar updated_at en orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER orders_updated_at_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Función para crear entrada en historial cuando cambia el estado
CREATE OR REPLACE FUNCTION create_order_status_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear historial si el estado cambió
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      status,
      status_message,
      tracking_number,
      notes,
      created_by
    ) VALUES (
      NEW.id,
      NEW.status,
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'Pedido confirmado y recibido'
        WHEN NEW.status = 'processing' THEN 'Pedido en proceso de preparación'
        WHEN NEW.status = 'shipped' THEN 'Pedido enviado'
        WHEN NEW.status = 'delivered' THEN 'Pedido entregado'
        WHEN NEW.status = 'cancelled' THEN 'Pedido cancelado'
        ELSE 'Estado actualizado a: ' || NEW.status
      END,
      NEW.tracking_number,
      NEW.notes,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear historial automáticamente
CREATE TRIGGER order_status_history_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_status_history();

-- =============================================
-- 8. CREAR FUNCIÓN PARA GENERAR NÚMERO DE ORDEN
-- =============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Generar número basado en timestamp y contador
    new_number := 'UF' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || 
                  LPAD(counter::TEXT, 3, '0');
    
    -- Verificar si ya existe
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_number) THEN
      RETURN new_number;
    END IF;
    
    counter := counter + 1;
    
    -- Evitar loop infinito
    IF counter > 999 THEN
      RAISE EXCEPTION 'Unable to generate unique order number';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. CREAR FUNCIÓN PARA INSERTAR HISTORIAL INICIAL
-- =============================================
CREATE OR REPLACE FUNCTION create_initial_order_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear entrada inicial en el historial cuando se crea una nueva orden
  INSERT INTO public.order_status_history (
    order_id,
    status,
    status_message,
    tracking_number,
    notes,
    created_by
  ) VALUES (
    NEW.id,
    NEW.status,
    'Pedido confirmado y recibido',
    NEW.tracking_number,
    'Pedido creado en el sistema',
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear historial inicial al insertar orden
CREATE TRIGGER order_initial_history_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_order_history();

-- =============================================
-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE public.orders IS 'Tabla principal de pedidos del sistema MAC Shop';
COMMENT ON TABLE public.order_items IS 'Items individuales de cada pedido';
COMMENT ON TABLE public.order_status_history IS 'Historial de cambios de estado de pedidos para seguimiento';

COMMENT ON COLUMN public.orders.order_number IS 'Número único de pedido formato UF + timestamp';
COMMENT ON COLUMN public.orders.status IS 'Estado actual: confirmed, processing, shipped, delivered, cancelled';
COMMENT ON COLUMN public.orders.payment_status IS 'Estado de pago: pending, paid, failed, refunded';
COMMENT ON COLUMN public.orders.tracking_number IS 'Número de seguimiento de la paquetería';

-- =============================================
-- SCRIPT COMPLETADO EXITOSAMENTE
-- =============================================
-- Este script crea un sistema completo de pedidos con:
-- ✅ Tabla de pedidos con toda la información necesaria
-- ✅ Tabla de items del pedido
-- ✅ Tabla de historial de estados para seguimiento
-- ✅ Índices para performance
-- ✅ Row Level Security (RLS) para seguridad
-- ✅ Triggers automáticos para historial
-- ✅ Función para generar números de orden únicos
-- ✅ Políticas de seguridad apropiadas
-- ✅ Sin datos de prueba problemáticos 