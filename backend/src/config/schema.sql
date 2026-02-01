-- =============================================
-- DELIVERY APP - DATABASE SCHEMA
-- =============================================
-- Ejecutar este script en tu proyecto de Supabase
-- SQL Editor: https://supabase.com/dashboard/project/[tu-proyecto]/sql

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para geolocalización

-- =============================================
-- TABLA: users
-- Información de usuarios (clientes)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: user_passwords
-- Hashes de contraseñas (para login local)
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: categories
-- Categorías de restaurantes/productos
-- =============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ENUM: store_type
-- Tipos de tiendas soportadas
-- =============================================
DO $$ BEGIN
    CREATE TYPE store_type AS ENUM (
        'restaurant',
        'pharmacy',
        'liquor_store',
        'pet_store',
        'grocery',
        'hardware',
        'convenience',
        'bakery',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLA: restaurants (stores)
-- Información de restaurantes/tiendas
-- =============================================
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT,
    logo_url TEXT,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    rating DECIMAL(2, 1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    estimated_delivery_time VARCHAR(50) DEFAULT '30-45 min',
    is_open BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    opening_hours JSONB DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    store_type store_type DEFAULT 'restaurant',
    requires_age_verification BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: products
-- Productos/items del menú
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    preparation_time INTEGER DEFAULT 15, -- minutos
    calories INTEGER,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: product_options
-- Opciones/customizaciones de productos
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    max_selections INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: product_option_items
-- Items de las opciones de productos
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_option_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: addresses
-- Direcciones guardadas de usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL, -- 'Casa', 'Trabajo', etc.
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    details TEXT, -- Instrucciones adicionales
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TIPOS ENUM
-- =============================================
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'picked_up',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'wallet', 'yape', 'plin', 'pos');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLA: orders
-- Pedidos de usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id),
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_latitude DECIMAL(10, 8) NOT NULL,
    delivery_longitude DECIMAL(11, 8) NOT NULL,
    notes TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: order_items
-- Items de cada pedido
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    customizations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: favorites
-- Restaurantes favoritos de usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

-- =============================================
-- TABLA: reviews
-- Reseñas de usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id)
);

-- =============================================
-- TABLA: coupons
-- Cupones de descuento
-- =============================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES para mejor rendimiento
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON public.restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_open ON public.restaurants(is_open);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON public.restaurants(rating DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON public.restaurants(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_products_restaurant ON public.products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON public.reviews(restaurant_id);

-- =============================================
-- FUNCIONES y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar rating del restaurante cuando se agrega review
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.restaurants
    SET 
        rating = (
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM public.reviews
            WHERE restaurant_id = NEW.restaurant_id
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE restaurant_id = NEW.restaurant_id
        )
    WHERE id = NEW.restaurant_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rating_on_review ON public.reviews;
CREATE TRIGGER update_rating_on_review
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurant_rating();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para direcciones
CREATE POLICY "Users can manage own addresses" ON public.addresses
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para pedidos
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para favoritos
CREATE POLICY "Users can manage own favorites" ON public.favorites
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para reviews
CREATE POLICY "Users can view all reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tablas públicas (lectura para todos)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Restaurants are viewable by everyone" ON public.restaurants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (is_available = true);

-- =============================================
-- FIN DEL SCHEMA
-- =============================================
