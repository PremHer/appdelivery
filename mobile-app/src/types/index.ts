// Tipos base de la aplicación

export type StoreType =
    | 'restaurant'
    | 'pharmacy'
    | 'liquor_store'
    | 'pet_store'
    | 'grocery'
    | 'hardware'
    | 'convenience'
    | 'bakery'
    | 'other';

export interface User {
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
}

export interface Restaurant {
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
    store_type: StoreType;
    requires_age_verification: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    image_url: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export interface ProductOptionItem {
    id: string;
    option_id: string;
    name: string;
    price_modifier: number;
    is_default: boolean;
}

export interface ProductOption {
    id: string;
    product_id: string;
    name: string;
    is_required: boolean;
    max_selections: number;
    items?: ProductOptionItem[];
}

export interface Product {
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
    options?: ProductOption[];
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'picked_up'
    | 'delivered'
    | 'cancelled';

export type PaymentMethod = 'cash' | 'yape' | 'plin' | 'lemon' | 'billetera_bcp' | 'tunki' | 'card' | 'pos';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
    id: string;
    user_id: string;
    restaurant_id: string;
    driver_id: string | null;
    status: OrderStatus;
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
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    created_at: string;
    updated_at: string;
    // Relaciones
    restaurant?: Restaurant;
    items?: OrderItem[];
    driver?: {
        id: string;
        full_name: string;
        phone: string | null;
        avatar_url: string | null;
        vehicle_type: string | null;
        vehicle_plate: string | null;
    };
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes: string | null;
    customizations: Record<string, unknown> | null;
    created_at: string;
    // Relaciones
    product?: Product;
}

export interface Address {
    id: string;
    user_id: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
    details: string | null;
    is_default: boolean;
    created_at: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    notes?: string;
    selectedOptions?: ProductOptionItem[];
    customizations?: Record<string, unknown>; // Mantener por compatibilidad backward si necesario
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: { field: string; message: string }[];
}
