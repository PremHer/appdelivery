// Types generados para la base de datos de Supabase
// Estos tipos se actualizarán cuando configures tu proyecto en Supabase

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    phone: string | null;
                    full_name: string;
                    avatar_url: string | null;
                    address: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    phone?: string | null;
                    full_name: string;
                    avatar_url?: string | null;
                    address?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    phone?: string | null;
                    full_name?: string;
                    avatar_url?: string | null;
                    address?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    is_active?: boolean;
                    updated_at?: string;
                };
            };
            restaurants: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    image_url: string | null;
                    logo_url: string | null;
                    address: string;
                    latitude: number;
                    longitude: number;
                    phone: string | null;
                    email: string | null;
                    rating: number;
                    total_reviews: number;
                    delivery_fee: number;
                    min_order_amount: number;
                    estimated_delivery_time: string;
                    is_open: boolean;
                    is_active: boolean;
                    opening_hours: Record<string, { open: string; close: string }>;
                    categories: string[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    image_url?: string | null;
                    logo_url?: string | null;
                    address: string;
                    latitude: number;
                    longitude: number;
                    phone?: string | null;
                    email?: string | null;
                    rating?: number;
                    total_reviews?: number;
                    delivery_fee?: number;
                    min_order_amount?: number;
                    estimated_delivery_time?: string;
                    is_open?: boolean;
                    is_active?: boolean;
                    opening_hours?: Record<string, { open: string; close: string }>;
                    categories?: string[];
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['restaurants']['Insert']>;
            };
            categories: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    icon: string | null;
                    image_url: string | null;
                    display_order: number;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    icon?: string | null;
                    image_url?: string | null;
                    display_order?: number;
                    is_active?: boolean;
                    created_at?: string;
                };
                Update: Partial<Database['public']['Tables']['categories']['Insert']>;
            };
            products: {
                Row: {
                    id: string;
                    restaurant_id: string;
                    category_id: string | null;
                    name: string;
                    description: string | null;
                    image_url: string | null;
                    price: number;
                    discount_price: number | null;
                    is_available: boolean;
                    is_featured: boolean;
                    preparation_time: number;
                    calories: number | null;
                    tags: string[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    restaurant_id: string;
                    category_id?: string | null;
                    name: string;
                    description?: string | null;
                    image_url?: string | null;
                    price: number;
                    discount_price?: number | null;
                    is_available?: boolean;
                    is_featured?: boolean;
                    preparation_time?: number;
                    calories?: number | null;
                    tags?: string[];
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['products']['Insert']>;
            };
            orders: {
                Row: {
                    id: string;
                    user_id: string;
                    restaurant_id: string;
                    driver_id: string | null;
                    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
                    subtotal: number;
                    delivery_fee: number;
                    discount: number;
                    total: number;
                    delivery_address: string;
                    delivery_latitude: number;
                    delivery_longitude: number;
                    notes: string | null;
                    estimated_delivery_time: string | null;
                    actual_delivery_time: string | null;
                    payment_method: 'cash' | 'card' | 'wallet';
                    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    restaurant_id: string;
                    driver_id?: string | null;
                    status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
                    subtotal: number;
                    delivery_fee: number;
                    discount?: number;
                    total: number;
                    delivery_address: string;
                    delivery_latitude: number;
                    delivery_longitude: number;
                    notes?: string | null;
                    estimated_delivery_time?: string | null;
                    payment_method: 'cash' | 'card' | 'wallet';
                    payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['orders']['Insert']>;
            };
            order_items: {
                Row: {
                    id: string;
                    order_id: string;
                    product_id: string;
                    quantity: number;
                    unit_price: number;
                    total_price: number;
                    notes: string | null;
                    customizations: Record<string, unknown> | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    order_id: string;
                    product_id: string;
                    quantity: number;
                    unit_price: number;
                    total_price: number;
                    notes?: string | null;
                    customizations?: Record<string, unknown> | null;
                    created_at?: string;
                };
                Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
            };
            addresses: {
                Row: {
                    id: string;
                    user_id: string;
                    label: string;
                    address: string;
                    latitude: number;
                    longitude: number;
                    details: string | null;
                    is_default: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    label: string;
                    address: string;
                    latitude: number;
                    longitude: number;
                    details?: string | null;
                    is_default?: boolean;
                    created_at?: string;
                };
                Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
            };
            favorites: {
                Row: {
                    id: string;
                    user_id: string;
                    restaurant_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    restaurant_id: string;
                    created_at?: string;
                };
                Update: Partial<Database['public']['Tables']['favorites']['Insert']>;
            };
            reviews: {
                Row: {
                    id: string;
                    user_id: string;
                    restaurant_id: string;
                    order_id: string;
                    rating: number;
                    comment: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    restaurant_id: string;
                    order_id: string;
                    rating: number;
                    comment?: string | null;
                    created_at?: string;
                };
                Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
            };
        };
        Views: {};
        Functions: {};
        Enums: {
            order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
            payment_method: 'cash' | 'card' | 'wallet';
            payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
        };
    };
}

// Tipos de utilidad para facilitar el uso
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Tipos específicos
export type User = Tables<'users'>;
export type Restaurant = Tables<'restaurants'>;
export type Category = Tables<'categories'>;
export type Product = Tables<'products'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type Address = Tables<'addresses'>;
export type Favorite = Tables<'favorites'>;
export type Review = Tables<'reviews'>;
