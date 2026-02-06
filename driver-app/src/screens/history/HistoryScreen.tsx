import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import { Clock, MapPin, DollarSign, Calendar } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function HistoryScreen() {
    const { colors } = useTheme();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('orders')
                .select('*, restaurant:restaurants(name)')
                .eq('driver_id', user.id)
                .in('status', ['delivered', 'cancelled'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
            onPress={() => (navigation as any).navigate('OrderDetail', { orderId: item.id })}
        >
            <View style={styles.row}>
                <Text style={[styles.restaurantName, { color: colors.text }]}>
                    {item.restaurant?.name || 'Restaurante'}
                </Text>
                <Text style={[
                    styles.statusBadge,
                    {
                        color: item.status === 'delivered' ? COLORS.success : COLORS.error,
                        backgroundColor: item.status === 'delivered' ? COLORS.success + '20' : COLORS.error + '20'
                    }
                ]}>
                    {item.status === 'delivered' ? 'Entregado' : 'Cancelado'}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Calendar size={14} color={COLORS.gray500} />
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <MapPin size={14} color={COLORS.gray500} />
                <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.delivery_address}
                </Text>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Ganancia:</Text>
                <Text style={[styles.totalValue, { color: COLORS.success }]}>
                    S/ {item.delivery_fee.toFixed(2)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.text === '#000000' ? 'dark-content' : 'light-content'} />
            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchHistory} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay historial de pedidos</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 16 },
    card: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    restaurantName: { fontSize: 16, fontWeight: 'bold' },
    statusBadge: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    dateText: { fontSize: 13 },
    addressText: { fontSize: 13, flex: 1 },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, gap: 8 },
    totalLabel: { fontSize: 13 },
    totalValue: { fontSize: 16, fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: 16 },
});
