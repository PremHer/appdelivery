import { supabase } from './supabase';
import type { Order, OrderItem, PaymentMethod } from '../types';

interface CreateOrderData {
    user_id: string; // Necesitamos el ID del usuario
    restaurant_id: string;
    items: {
        product_id: string;
        quantity: number;
        unit_price: number; // Precio al momento de la compra
        notes?: string;
        customizations?: Record<string, unknown>;
    }[];
    subtotal: number;
    delivery_fee: number;
    total: number;
    delivery_address: string;
    delivery_latitude: number;
    delivery_longitude: number;
    notes?: string;
    payment_method: PaymentMethod;
}

export const orderService = {
    async createOrder(data: CreateOrderData): Promise<Order> {
        // 1. Crear la orden cabecera
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: data.user_id,
                restaurant_id: data.restaurant_id,
                status: 'pending',
                subtotal: data.subtotal,
                delivery_fee: data.delivery_fee,
                discount: 0, // Por ahora 0
                total: data.total,
                delivery_address: data.delivery_address,
                delivery_latitude: data.delivery_latitude || 0,
                delivery_longitude: data.delivery_longitude || 0,
                notes: data.notes,
                payment_method: data.payment_method,
                payment_status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (orderError) {
            console.error('Error creando orden:', orderError);
            throw new Error(orderError.message);
        }

        const order = orderData as Order;

        // 2. Crear los items de la orden
        const itemsToInsert = data.items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
            notes: item.notes,
            customizations: item.customizations || {},
            created_at: new Date().toISOString()
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('Error creando items:', itemsError);
            // Idealmente aquí haríamos rollback borrando la orden, pero por simplicidad lanzamos error
            throw new Error('Error al guardar los productos del pedido');
        }

        // 3. Notify online drivers about the new order
        try {
            // Fetch restaurant info for notification
            const { data: restaurant } = await supabase
                .from('restaurants')
                .select('name, latitude, longitude')
                .eq('id', data.restaurant_id)
                .single();

            // Call backend notification endpoint
            await fetch('http://localhost:3000/api/v1/notifications/new-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    restaurantName: restaurant?.name,
                    restaurantLat: restaurant?.latitude,
                    restaurantLng: restaurant?.longitude,
                    total: data.delivery_fee
                })
            });
        } catch (notifyError) {
            // Don't fail the order if notification fails
            console.warn('Could not notify drivers:', notifyError);
        }

        return order;
    },

    async getOrders(userId: string): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                restaurant:restaurants(*),
                items:order_items(*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo pedidos:', error);
            throw new Error(error.message);
        }

        return data as any[];
    },

    async getOrderById(id: string): Promise<Order> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                restaurant:restaurants(*),
                items:order_items(*, product:products(*))
            `)
            .eq('id', id)
            .single();

        if (error) {
            throw new Error(error.message);
        }
        return data as any;
    },

    async cancelOrder(id: string, reason?: string): Promise<void> {
        // Solo podemos cancelar si está pendiente
        const { error } = await supabase
            .from('orders')
            .update({ status: 'cancelled', notes: reason ? `Cancelado: ${reason}` : undefined })
            .eq('id', id)
            .eq('status', 'pending'); // Seguridad simple

        if (error) throw new Error(error.message);
    }
};

export default orderService;
