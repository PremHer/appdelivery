import { supabase } from './supabase';
import type { Address } from '../types';

export const addressService = {
    async getAddresses(userId: string): Promise<Address[]> {
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false }); // Default primero

        if (error) throw new Error(error.message);
        return data as Address[];
    },

    async addAddress(address: Omit<Address, 'id' | 'created_at'>): Promise<Address> {
        // Si es default, quitar default a las otras
        if (address.is_default) {
            await supabase
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', address.user_id);
        }

        const { data, error } = await supabase
            .from('addresses')
            .insert(address)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as Address;
    },

    async deleteAddress(id: string): Promise<void> {
        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};

export default addressService;
