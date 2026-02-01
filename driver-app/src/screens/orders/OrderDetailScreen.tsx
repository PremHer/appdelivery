import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants';
import { MapPin, Phone, CheckCircle, Navigation, MessageCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function OrderDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { orderId } = route.params as { orderId: string };
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    restaurant:restaurants(name, address, phone, latitude, longitude),
                    user:users!user_id(full_name, phone),
                    items:order_items(
                        quantity,
                        unit_price,
                        product:products(name)
                    )
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            Alert.alert('Error', 'No se pudo cargar el pedido');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId); // RLS Check: drivers can update assigned orders? (Wait, policy said 'Admins can update'. I need to check Policies)

            if (error) throw error;

            Alert.alert('Éxito', `Estado actualizado a: ${newStatus === 'picked_up' ? 'En Camino' : 'Entregado'}`);
            fetchOrderDetails();
            if (newStatus === 'delivered') {
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Error', 'No tienes permiso para actualizar este pedido o ocurrió un error.');
        }
    };

    const openMaps = (lat: number, lon: number, label: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        Linking.openURL(url);
    };

    if (loading) return <View style={styles.center}><Text>Cargando details...</Text></View>;
    if (!order) return <View style={styles.center}><Text>Pedido no encontrado</Text></View>;

    const getActionRef = () => {
        // confirmed or preparing -> pick up the order
        if (order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready') {
            return { label: 'MARCAR EN CAMINO', action: () => updateStatus('picked_up'), color: COLORS.primary };
        }
        // picked_up -> deliver
        if (order.status === 'picked_up') {
            return { label: 'FINALIZAR ENTREGA', action: () => updateStatus('delivered'), color: COLORS.success };
        }
        return null;
    };

    const action = getActionRef();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.title}>Pedido #{order.id.slice(0, 8)}</Text>
                <View style={[styles.badge, { backgroundColor: COLORS.gray200 }]}>
                    <Text style={styles.badgeText}>{order.status.toUpperCase()}</Text>
                </View>
            </View>

            {/* Restaurant */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Restaurante</Text>
                <Text style={styles.name}>{order.restaurant?.name}</Text>
                <TouchableOpacity onPress={() => openMaps(order.restaurant.latitude, order.restaurant.longitude, 'Restaurante')} style={styles.row}>
                    <MapPin size={18} color={COLORS.primary} />
                    <Text style={styles.link}>{order.restaurant?.address}</Text>
                </TouchableOpacity>
            </View>

            {/* Customer */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Cliente</Text>
                <Text style={styles.name}>{order.user?.full_name}</Text>
                <TouchableOpacity onPress={() => openMaps(order.delivery_latitude, order.delivery_longitude, 'Cliente')} style={styles.row}>
                    <Navigation size={18} color={COLORS.secondary} />
                    <Text style={styles.link}>{order.delivery_address}</Text>
                </TouchableOpacity>
                <View style={styles.contactRow}>
                    <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${order.user?.phone}`)}
                        style={styles.contactButton}
                    >
                        <Phone size={18} color={COLORS.white} />
                        <Text style={styles.contactButtonText}>Llamar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => (navigation as any).navigate('Chat', {
                            orderId: order.id,
                            customerName: order.user?.full_name,
                        })}
                        style={[styles.contactButton, { backgroundColor: COLORS.primary }]}
                    >
                        <MessageCircle size={18} color={COLORS.white} />
                        <Text style={styles.contactButtonText}>Chat</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Items */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Items</Text>
                {order.items?.map((item: any, index: number) => (
                    <View key={index} style={styles.itemRow}>
                        <Text style={styles.qty}>{item.quantity}x</Text>
                        <Text style={styles.itemName}>{item.product?.name}</Text>
                    </View>
                ))}
            </View>

            {/* Ver en Mapa Button */}
            <TouchableOpacity
                style={[styles.button, { backgroundColor: COLORS.secondary }]}
                onPress={() => (navigation as any).navigate('DeliveryMap', {
                    restaurantName: order.restaurant?.name,
                    restaurantLat: order.restaurant?.latitude,
                    restaurantLng: order.restaurant?.longitude,
                    customerName: order.user?.full_name,
                    customerLat: order.delivery_latitude,
                    customerLng: order.delivery_longitude,
                    customerPhone: order.user?.phone,
                    orderStatus: order.status
                })}
            >
                <Text style={styles.buttonText}>🗺️ VER EN MAPA</Text>
            </TouchableOpacity>

            {/* Action Button */}
            {action && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: action.color }]}
                    onPress={action.action || undefined}
                    disabled={!action.action}
                >
                    <Text style={styles.buttonText}>{action.label}</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50, padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    section: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold' },
    badge: { alignSelf: 'flex-start', padding: 4, borderRadius: 4, marginTop: 8 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 14, color: COLORS.gray500, marginBottom: 8, textTransform: 'uppercase' },
    name: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    link: { color: COLORS.primary, textDecorationLine: 'underline' },
    contactRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.success,
        paddingVertical: 10,
        borderRadius: 8
    },
    contactButtonText: { color: COLORS.white, fontWeight: '600' },
    itemRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
    qty: { fontWeight: 'bold' },
    itemName: { flex: 1 },
    button: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
