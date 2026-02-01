import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { MapPin, Clock, DollarSign } from 'lucide-react-native';

export default function OrdersScreen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('orders')
                .select('*, restaurant:restaurants(name, address), user:users!user_id(full_name, phone)')
                .eq('driver_id', user.id)
                .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'picked_up']) // Show all active tasks
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };


    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const navigation = useNavigation();

    const renderOrder = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetail' as never, { orderId: item.id } as never)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
                <View style={[styles.badge,
                { backgroundColor: item.status === 'picked_up' ? COLORS.primary : COLORS.success }
                ]}>
                    <Text style={styles.badgeText}>
                        {item.status === 'picked_up' ? 'En Camino' : 'Listo para Recoger'}
                    </Text>
                </View>
            </View>

            <View style={styles.row}>
                <MapPin size={16} color={COLORS.gray500} />
                <Text style={styles.address} numberOfLines={1}>
                    {item.delivery_address}
                </Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.row}>
                    <Clock size={16} color={COLORS.gray500} />
                    <Text style={styles.detailText}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <View style={styles.row}>
                    <DollarSign size={16} color={COLORS.success} />
                    <Text style={[styles.detailText, { color: COLORS.success, fontWeight: 'bold' }]}>
                        S/ {item.delivery_fee.toFixed(2)} (Delivery)
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Mis Pedidos</Text>
            </View>
            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No tienes pedidos asignados</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray50,
    },
    header: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    address: {
        flex: 1,
        fontSize: 14,
        color: COLORS.gray700,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
    },
    detailText: {
        fontSize: 14,
        color: COLORS.gray500,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        color: COLORS.gray500,
        fontSize: 16,
    },
});
