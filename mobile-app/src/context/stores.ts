import { create } from 'zustand';
import type { User, CartItem, Product, Address, ProductOptionItem } from '../types';

// ================================
// Auth Store
// ================================
interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setToken: (token) => set({ token }),
    setLoading: (isLoading) => set({ isLoading }),

    login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
    }),

    logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
    }),
}));

// ================================
// Cart Store
// ================================
interface CartState {
    items: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;

    // Actions
    addItem: (payload: { product: Product; quantity?: number; notes?: string; selectedOptions?: ProductOptionItem[]; customizations?: any }) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    setRestaurant: (id: string, name: string) => void;

    // Getters
    getItemCount: () => number;
    getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    restaurantId: null,
    restaurantName: null,

    addItem: ({ product, quantity = 1, notes, selectedOptions, customizations }) => {
        const { items, restaurantId } = get();

        // Si hay items de otro restaurante, preguntar
        if (restaurantId && restaurantId !== product.restaurant_id) {
            // En un caso real, mostrar un alert
            set({ items: [], restaurantId: null, restaurantName: null });
        }

        // Logic to detect duplicates based on options
        // For simplicity now, we just match by product ID, BUT with options we should match strictly.
        // If strict match needed: check options equality.
        // For now, let's allow "stacking" if options are identical, or separate item if diff.
        // Simpler approach for MVP: Add as new item if options exist.

        // Let's implement simple ID check for now, but really we should differentiate.
        // If we add options support properly, we should treat same product with diff options as diff items.
        // To do this, we can't just use product.id.
        // We'll leave it simple: stack only if NO options. If options, always add new row (or improve check later).

        let existingIndex = -1;

        if (!selectedOptions || selectedOptions.length === 0) {
            existingIndex = items.findIndex((item) =>
                item.product.id === product.id &&
                (!item.selectedOptions || item.selectedOptions.length === 0)
            );
        }

        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex].quantity += quantity;
            set({ items: newItems });
        } else {
            set({
                items: [...items, { product, quantity, notes, selectedOptions, customizations }],
                restaurantId: product.restaurant_id,
            });
        }
    },

    removeItem: (productId) => {
        const { items } = get();
        const newItems = items.filter((item) => item.product.id !== productId);

        if (newItems.length === 0) {
            set({ items: [], restaurantId: null, restaurantName: null });
        } else {
            set({ items: newItems });
        }
    },

    updateQuantity: (productId, quantity) => {
        const { items } = get();

        if (quantity <= 0) {
            get().removeItem(productId);
            return;
        }

        const newItems = items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
        );
        set({ items: newItems });
    },

    clearCart: () => set({
        items: [],
        restaurantId: null,
        restaurantName: null,
    }),

    setRestaurant: (id, name) => set({
        restaurantId: id,
        restaurantName: name,
    }),

    getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },

    getSubtotal: () => {
        return get().items.reduce((sum, item) => {
            const basePrice = item.product.discount_price || item.product.price;
            const optionsPrice = item.selectedOptions?.reduce((optSum, opt) => optSum + (opt.price_modifier || 0), 0) || 0;
            return sum + (basePrice + optionsPrice) * item.quantity;
        }, 0);
    },
}));

// ================================
// Location Store
// ================================
interface LocationState {
    currentAddress: Address | null;
    coordinates: { latitude: number; longitude: number } | null;
    addresses: Address[];

    // Actions
    setCurrentAddress: (address: Address | null) => void;
    setCoordinates: (coords: { latitude: number; longitude: number } | null) => void;
    setAddresses: (addresses: Address[]) => void;
    addAddress: (address: Address) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
    currentAddress: null,
    coordinates: null,
    addresses: [],

    setCurrentAddress: (currentAddress) => set({ currentAddress }),
    setCoordinates: (coordinates) => set({ coordinates }),
    setAddresses: (addresses) => set({ addresses }),
    addAddress: (address) => set({ addresses: [...get().addresses, address] }),
}));

// ================================
// UI Store (para estados globales de UI)
// ================================
interface UIState {
    isSearchOpen: boolean;
    searchQuery: string;
    activeCategory: string | null;

    // Actions
    toggleSearch: () => void;
    setSearchQuery: (query: string) => void;
    setActiveCategory: (category: string | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
    isSearchOpen: false,
    searchQuery: '',
    activeCategory: null,

    toggleSearch: () => set({ isSearchOpen: !get().isSearchOpen }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setActiveCategory: (activeCategory) => set({ activeCategory }),
}));
