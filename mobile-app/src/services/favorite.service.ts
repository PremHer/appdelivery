import { supabase } from './supabase';
import type { Restaurant } from '../types';

export const favoriteService = {
    async toggleFavorite(userId: string, restaurantId: string): Promise<boolean> {
        // Check if exists
        const { data } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();

        if (data) {
            // Delete
            await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('restaurant_id', restaurantId);
            return false; // Removed
        } else {
            // Insert
            await supabase
                .from('favorites')
                .insert({ user_id: userId, restaurant_id: restaurantId });
            return true; // Added
        }
    },

    async isFavorite(userId: string, restaurantId: string): Promise<boolean> {
        const { data } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();
        return !!data;
    },

    async getFavorites(userId: string): Promise<Restaurant[]> {
        // Método en 2 pasos para evitar errores de relación "embedded" si no están configuradas explícitamente
        // 1. Obtener los IDs de restaurantes favoritos
        const { data: favoritesData, error: favError } = await supabase
            .from('favorites')
            .select('restaurant_id')
            .eq('user_id', userId);

        if (favError) throw new Error(favError.message);

        if (!favoritesData || favoritesData.length === 0) return [];

        const restaurantIds = favoritesData.map(f => f.restaurant_id);

        // 2. Obtener los detalles de esos restaurantes
        const { data: restaurantsData, error: restError } = await supabase
            .from('restaurants')
            .select('*')
            .in('id', restaurantIds)
            .eq('is_active', true);

        if (restError) throw new Error(restError.message);

        return restaurantsData as Restaurant[];
    }
};

export default favoriteService;
