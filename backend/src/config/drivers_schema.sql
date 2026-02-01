-- =============================================
-- TABLA: driver_profiles
-- Perfiles extendidos para repartidores
-- =============================================
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL, -- 'moto', 'bicycle', 'car'
    license_plate VARCHAR(20),
    vehicle_model VARCHAR(100),
    vehicle_color VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    is_online BOOLEAN DEFAULT false,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    last_location_update TIMESTAMP WITH TIME ZONE,
    rating DECIMAL(2, 1) DEFAULT 5.0,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for geolocation (if needed later)
-- CREATE INDEX idx_driver_location ON public.driver_profiles USING GIST ( ST_SetSRID(ST_MakePoint(current_longitude, current_latitude), 4326) );
