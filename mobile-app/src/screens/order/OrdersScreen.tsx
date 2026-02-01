import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants'; // Asumiendo que FONTS existe, si no usaremos estilos normales
import { useAuthStore, useCartStore } from '../../context/stores';
import orderService from '../../services/order.service';
import Button from '../../components/ui/Button';
import type { Order, OrderStatus } from '../../types';
import { Alert } from 'react-native';

interface OrdersScreenProps {
    navigation: any;
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({ navigation }) => {
    const { user } = useAuthStore();
    const { clearCart, addItem, setRestaurant } = useCartStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadOrders = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const data = await orderService.getOrders(user.id);
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Cargar al montar y cada vez que la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [user])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'delivered':
            case 'picked_up':
                return COLORS.success;
            case 'cancelled':
                return COLORS.error;
            case 'pending':
            case 'confirmed':
            case 'preparing':
            case 'ready':
                return COLORS.primary; // Naranja
            default:
                return COLORS.gray500;
        }
    };

    const getStatusText = (status: OrderStatus) => {
        const labels: Record<string, string> = {
            pending: 'Pendiente',
            confirmed: 'Confirmado',
            preparing: 'Preparando',
            ready: 'Listo para envío',
            picked_up: 'En camino',
            delivered: 'Entregado',
            cancelled: 'Cancelado',
        };
        return labels[status] || status;
    };

    const handleReorder = (order: Order) => {
        Alert.alert(
            '🔄 Repetir Pedido',
            `¿Deseas agregar los productos de ${order.restaurant?.name || 'este pedido'} a tu carrito?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Repetir',
                    onPress: () => {
                        // Clear cart and add items from the order
                        clearCart();

                        if (order.restaurant) {
                            setRestaurant(order.restaurant.id, order.restaurant.name);
                        }

                        // Add each item to cart
                        order.items?.forEach((orderItem: any) => {
                            if (orderItem.product) {
                                addItem({
                                    product: orderItem.product,
                                    quantity: orderItem.quantity,
                                    notes: orderItem.notes,
                                });
                            }
                        });

                        Alert.alert(
                            '✅ ¡Listo!',
                            'Los productos se agregaron a tu carrito',
                            [
                                { text: 'Ver Carrito', onPress: () => navigation.navigate('Cart') },
                                { text: 'Seguir Comprando', style: 'cancel' }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const renderOrderItem = ({ item }: { item: Order }) => {
        const statusColor = getStatusColor(item.status);
        const date = new Date(item.created_at);
        const formattedDate = format(date, "d MMM, h:mm a", { locale: es });

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    navigation.navigate('OrderTracking', { orderId: item.id });
                }}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.restaurantInfo}>
                        <Image
                            source={{
                                uri: item.restaurant?.logo_url || 'https://via.placeholder.com/50'
                            }}
                            style={styles.logo}
                        />
                        <View>
                            <Text style={styles.restaurantName}>
                                {item.restaurant?.name || 'Restaurante Desconocido'}
                            </Text>
                            <Text style={styles.dateText}>{formattedDate}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {getStatusText(item.status)}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                    <Text style={styles.summaryText}>
                        {item.items?.length || 0} items
                    </Text>
                    <Text style={styles.totalPrice}>
                        S/. {item.total.toFixed(2)}
                    </Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.detailButton}>
                        <Text style={styles.detailButtonText}>Ver Detalle</Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                    </TouchableOpacity>

                    {/* Botón Reordenar solo si está entregado o cancelado */}
                    {['delivered', 'cancelled'].includes(item.status) && (
                        <TouchableOpacity
                            style={styles.reorderButton}
                            onPress={() => handleReorder(item)}
                        >
                            <Ionicons name="repeat" size={16} color={COLORS.gray700} />
                            <Text style={styles.reorderText}>Repetir</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing && orders.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="person-circle-outline" size={80} color={COLORS.gray400} />
                    <Text style={styles.emptyTitle}>Inicia Sesión</Text>
                    <Text style={styles.emptyText}>
                        Para ver tus pedidos, necesitas ingresar a tu cuenta.
                    </Text>
                    <Button
                        title="Iniciar Sesión"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.button}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Pedidos</Text>
            </View>

            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={80} color={COLORS.gray300} />
                    <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
                    <Text style={styles.emptyText}>
                        ¡Empieza a explorar los mejores restaurantes!
                    </Text>
                    <Button
                        title="Pedir Ahora"
                        onPress={() => navigation.navigate('Home')}
                        style={styles.button}
                    />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    headerTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    listContent: {
        padding: SIZES.lg,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        marginBottom: SIZES.md,
        ...SHADOWS.small,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    restaurantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        marginRight: SIZES.sm,
    },
    restaurantName: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    dateText: {
        fontSize: SIZES.fontXs,
        color: COLORS.gray500,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: SIZES.sm,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.sm,
    },
    summaryText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
    },
    totalPrice: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailButtonText: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
        color: COLORS.primary,
        marginRight: 2,
    },
    reorderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    reorderText: {
        fontSize: SIZES.fontXs,
        fontWeight: '600',
        color: COLORS.gray700,
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.xl,
    },
    emptyTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
        marginTop: SIZES.lg,
        marginBottom: SIZES.xs,
    },
    emptyText: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        textAlign: 'center',
        marginBottom: SIZES.xl,
    },
    button: {
        minWidth: 200,
    },
});

export default OrdersScreen;
