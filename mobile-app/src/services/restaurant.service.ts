import api from './api';
import type { Restaurant, Category, Product, ApiResponse } from '../types';

interface RestaurantFilters {
    category?: string;
    search?: string;
    latitude?: number;
    longitude?: number;
    sortBy?: 'rating' | 'delivery_time' | 'delivery_fee' | 'distance';
    page?: number;
    limit?: number;
}

interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export const restaurantService = {
    async getCategories(): Promise<Category[]> {
        const response = await api.get<ApiResponse<Category[]>>('/categories');
        return response.data.data || [];
    },

    async getRestaurants(filters?: RestaurantFilters): Promise<PaginatedResponse<Restaurant>> {
        const response = await api.get<ApiResponse<PaginatedResponse<Restaurant>>>('/restaurants', {
            params: filters,
        });
        return response.data.data || { items: [], total: 0, page: 1, limit: 10, hasMore: false };
    },

    async getRestaurantById(id: string): Promise<Restaurant> {
        const response = await api.get<ApiResponse<Restaurant>>(`/restaurants/${id}`);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.message || 'Restaurante no encontrado');
        }
        return response.data.data;
    },

    async getRestaurantProducts(restaurantId: string): Promise<Product[]> {
        const response = await api.get<ApiResponse<Product[]>>(`/restaurants/${restaurantId}/products`);
        return response.data.data || [];
    },

    async getFeaturedRestaurants(): Promise<Restaurant[]> {
        const response = await api.get<ApiResponse<Restaurant[]>>('/restaurants/featured');
        return response.data.data || [];
    },

    async getNearbyRestaurants(latitude: number, longitude: number, radius?: number): Promise<Restaurant[]> {
        const response = await api.get<ApiResponse<Restaurant[]>>('/restaurants/nearby', {
            params: { latitude, longitude, radius: radius || 5 },
        });
        return response.data.data || [];
    },

    async searchRestaurants(query: string): Promise<Restaurant[]> {
        const response = await api.get<ApiResponse<Restaurant[]>>('/restaurants/search', {
            params: { q: query },
        });
        return response.data.data || [];
    },

    async toggleFavorite(restaurantId: string): Promise<boolean> {
        const response = await api.post<ApiResponse<{ isFavorite: boolean }>>(`/restaurants/${restaurantId}/favorite`);
        return response.data.data?.isFavorite || false;
    },

    async getFavorites(): Promise<Restaurant[]> {
        const response = await api.get<ApiResponse<Restaurant[]>>('/restaurants/favorites');
        return response.data.data || [];
    },
};

export default restaurantService;
