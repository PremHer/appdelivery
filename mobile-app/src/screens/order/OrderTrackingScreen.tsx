import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    Animated,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, SIZES, SHADOWS } from '../../constants';
import Button from '../../components/ui/Button';
import { supabase } from '../../services/supabase';
import notificationService from '../../services/notification.service';
import RatingModal from '../../components/modals/RatingModal';
import type { Order, OrderStatus } from '../../types';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 280;

interface OrderTrackingScreenProps {
    navigation: any;
    route: any;
}

const STEPS = [
    { key: 'confirmed', label: 'Confirmado', icon: 'checkmark-circle' },
    { key: 'preparing', label: 'Preparando', icon: 'restaurant' },
    { key: 'ready', label: 'En camino', icon: 'bicycle' },
    { key: 'delivered', label: 'Entregado', icon: 'home' },
];

const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({ navigation, route }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
    const mapRef = useRef<MapView>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Calculate estimated delivery time based on status and distance
    const calculateEstimatedTime = (orderData: Order) => {
        if (!orderData.restaurant?.latitude || !orderData.delivery_latitude) {
            setEstimatedMinutes(35); // Default
            return;
        }

        const distance = calculateDistance(
            orderData.restaurant.latitude,
            orderData.restaurant.longitude,
            orderData.delivery_latitude,
            orderData.delivery_longitude
        );

        // Base times (in minutes)
        const prepTime = orderData.status === 'confirmed' ? 15 : orderData.status === 'preparing' ? 10 : 0;
        const travelTime = Math.ceil(distance * 4); // ~15 km/h average speed = 4 min/km
        const baseBuffer = 5; // Buffer time

        let totalMinutes = prepTime + travelTime + baseBuffer;

        // Adjust based on status
        if (orderData.status === 'picked_up') {
            totalMinutes = travelTime + 3; // Just travel time plus small buffer
        } else if (orderData.status === 'delivered') {
            totalMinutes = 0;
        }

        setEstimatedMinutes(Math.max(5, Math.min(60, totalMinutes))); // Clamp between 5-60 min
    };

    // Simulated locations (in production these would come from the order/driver)
    const defaultRegion = {
        latitude: -12.0464,
        longitude: -77.0428,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    };

    useEffect(() => {
        fetchOrder();

        // Real-time order updates
        const subscription = supabase
            .channel(`order_tracking_${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    const newOrder = payload.new as Order;
                    const oldOrder = order;

                    // Send notification if status changed
                    if (oldOrder && newOrder.status !== oldOrder.status) {
                        notificationService.notifyOrderStatus(
                            orderId,
                            newOrder.status,
                            newOrder.restaurant?.name
                        );

                        // Show rating modal when delivered
                        if (newOrder.status === 'delivered' && !hasRated) {
                            setTimeout(() => setShowRatingModal(true), 1000);
                        }
                    }

                    setOrder(newOrder);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [orderId]);

    // Pulse animation for driver marker
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Simulate driver movement
    useEffect(() => {
        if (!order || order.status === 'delivered' || order.status === 'cancelled') return;

        const storeLocation = order.restaurant ? {
            latitude: order.restaurant.latitude,
            longitude: order.restaurant.longitude,
        } : null;

        const deliveryLocation = order.delivery_latitude && order.delivery_longitude ? {
            latitude: order.delivery_latitude,
            longitude: order.delivery_longitude,
        } : null;

        if (!storeLocation || !deliveryLocation) return;

        // Start driver at store, move towards delivery
        let progress = order.status === 'ready' || order.status === 'picked_up' ? 0.3 : 0;

        const interval = setInterval(() => {
            if (progress >= 1) {
                clearInterval(interval);
                return;
            }

            progress += 0.05;
            const newLat = storeLocation.latitude + (deliveryLocation.latitude - storeLocation.latitude) * progress;
            const newLng = storeLocation.longitude + (deliveryLocation.longitude - storeLocation.longitude) * progress;

            setDriverLocation({
                latitude: newLat,
                longitude: newLng,
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [order?.status]);

    const fetchOrder = async () => {
        try {
            // Fetch order with restaurant and items first
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    restaurant:restaurants(*),
                    items:order_items(*, product:products(*))
                `)
                .eq('id', orderId)
                .single();

            if (error) {
                console.error('Error fetching order:', error);
                throw error;
            }

            // If order has a driver, fetch driver info separately
            let orderWithDriver = { ...data, driver: null };
            if (data.driver_id) {
                const { data: driverData, error: driverError } = await supabase
                    .from('users')
                    .select('id, full_name, phone, vehicle_type, vehicle_plate')
                    .eq('id', data.driver_id)
                    .single();

                if (!driverError && driverData) {
                    orderWithDriver.driver = driverData;
                }
            }

            setOrder(orderWithDriver);
            calculateEstimatedTime(orderWithDriver);

            // Initialize driver location at store
            if (orderWithDriver.restaurant) {
                setDriverLocation({
                    latitude: orderWithDriver.restaurant.latitude,
                    longitude: orderWithDriver.restaurant.longitude,
                });
            }
        } catch (error: any) {
            console.error('Error fetching order:', error);
            Alert.alert('Error', 'No se pudo cargar el pedido: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = () => {
        if (!order) return;

        // Only allow cancellation for pending or confirmed orders
        if (!['pending', 'confirmed'].includes(order.status)) {
            Alert.alert(
                '❌ No se puede cancelar',
                'Tu pedido ya está siendo preparado y no puede ser cancelado.',
                [{ text: 'Entendido' }]
            );
            return;
        }

        Alert.alert(
            '¿Cancelar Pedido?',
            'Por favor selecciona el motivo de cancelación:',
            [
                { text: 'Volver', style: 'cancel' },
                {
                    text: 'Cambié de opinión',
                    onPress: () => confirmCancelOrder('Cambié de opinión')
                },
                {
                    text: 'Tiempo de espera muy largo',
                    onPress: () => confirmCancelOrder('Tiempo de espera muy largo')
                },
                {
                    text: 'Pedí por error',
                    onPress: () => confirmCancelOrder('Pedí por error')
                },
                {
                    text: 'Otro motivo',
                    onPress: () => confirmCancelOrder('Otro motivo')
                },
            ]
        );
    };

    const confirmCancelOrder = async (reason: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancellation_reason: reason,
                })
                .eq('id', orderId);

            if (error) throw error;

            setOrder({ ...order!, status: 'cancelled' });

            Alert.alert(
                '✅ Pedido Cancelado',
                'Tu pedido ha sido cancelado exitosamente.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error cancelling order:', error);
            Alert.alert('Error', 'No se pudo cancelar el pedido. Intenta de nuevo.');
        }
    };

    const getStepStatus = (stepKey: string, currentStatus: OrderStatus) => {
        const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const stepIndex = statusOrder.indexOf(stepKey);

        if (currentStatus === 'cancelled') return 'cancelled';
        if (currentIndex >= stepIndex) return 'completed';
        return 'pending';
    };

    const renderStep = (step: typeof STEPS[0], index: number) => {
        if (!order) return null;

        const status = getStepStatus(step.key, order.status);
        const isLast = index === STEPS.length - 1;

        return (
            <View key={step.key} style={styles.stepContainer}>
                <View style={styles.stepLeft}>
                    <View style={[
                        styles.stepIconContainer,
                        status === 'completed' && styles.stepIconCompleted,
                        status === 'cancelled' && styles.stepIconCancelled
                    ]}>
                        <Ionicons
                            name={step.icon as any}
                            size={16}
                            color={status === 'completed' ? COLORS.white : COLORS.gray400}
                        />
                    </View>
                    {!isLast && (
                        <View style={[
                            styles.stepLine,
                            status === 'completed' && styles.stepLineCompleted
                        ]} />
                    )}
                </View>
                <View style={styles.stepRight}>
                    <Text style={[
                        styles.stepTitle,
                        status === 'completed' && styles.stepTitleCompleted
                    ]}>
                        {step.label}
                    </Text>
                </View>
            </View>
        );
    };

    const fitMapToMarkers = () => {
        if (!mapRef.current || !order?.restaurant) return;

        const coordinates = [
            {
                latitude: order.restaurant.latitude,
                longitude: order.restaurant.longitude,
            },
        ];

        if (order.delivery_latitude && order.delivery_longitude) {
            coordinates.push({
                latitude: order.delivery_latitude,
                longitude: order.delivery_longitude,
            });
        }

        if (driverLocation) {
            coordinates.push(driverLocation);
        }

        mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
        });
    };

    if (loading || !order) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text>Cargando pedido...</Text>
            </SafeAreaView>
        );
    }

    const storeLocation = order.restaurant ? {
        latitude: order.restaurant.latitude,
        longitude: order.restaurant.longitude,
    } : null;

    const deliveryLocation = order.delivery_latitude && order.delivery_longitude ? {
        latitude: order.delivery_latitude,
        longitude: order.delivery_longitude,
    } : null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seguimiento</Text>
                <TouchableOpacity onPress={fitMapToMarkers} style={styles.closeButton}>
                    <Ionicons name="locate" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView>
                {/* Map */}
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={storeLocation ? {
                            ...storeLocation,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        } : defaultRegion}
                        onMapReady={fitMapToMarkers}
                    >
                        {/* Store Marker */}
                        {storeLocation && (
                            <Marker
                                coordinate={storeLocation}
                                title={order.restaurant?.name}
                                description="Tienda"
                            >
                                <View style={styles.storeMarker}>
                                    <Ionicons name="storefront" size={20} color={COLORS.white} />
                                </View>
                            </Marker>
                        )}

                        {/* Delivery Address Marker */}
                        {deliveryLocation && (
                            <Marker
                                coordinate={deliveryLocation}
                                title="Dirección de entrega"
                                description={order.delivery_address}
                            >
                                <View style={styles.deliveryMarker}>
                                    <Ionicons name="home" size={20} color={COLORS.white} />
                                </View>
                            </Marker>
                        )}

                        {/* Driver Marker */}
                        {driverLocation && order.status !== 'delivered' && (
                            <Marker
                                coordinate={driverLocation}
                                title="Repartidor"
                                description="Tu pedido está aquí"
                            >
                                <Animated.View style={[styles.driverMarker, { transform: [{ scale: pulseAnim }] }]}>
                                    <Ionicons name="bicycle" size={18} color={COLORS.white} />
                                </Animated.View>
                            </Marker>
                        )}

                        {/* Route Line */}
                        {storeLocation && deliveryLocation && (
                            <Polyline
                                coordinates={[
                                    storeLocation,
                                    ...(driverLocation ? [driverLocation] : []),
                                    deliveryLocation,
                                ]}
                                strokeColor={COLORS.primary}
                                strokeWidth={3}
                                lineDashPattern={[1]}
                            />
                        )}
                    </MapView>

                    <View style={styles.statusOverlay}>
                        <Text style={styles.statusText}>
                            {order.status === 'delivered'
                                ? '¡Pedido Entregado!'
                                : order.status === 'preparing'
                                    ? 'Preparando tu pedido...'
                                    : order.status === 'ready' || order.status === 'picked_up'
                                        ? 'En camino a tu dirección'
                                        : 'Pedido confirmado'}
                        </Text>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <Text style={styles.etaText}>
                                ⏱️ Llegada estimada: {estimatedMinutes ? `${estimatedMinutes} min` : '30-45 min'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Progress Steps */}
                <View style={styles.stepsCard}>
                    <Text style={styles.sectionTitle}>Estado del Pedido</Text>
                    <View style={styles.stepsRow}>
                        {STEPS.map((step, index) => renderStep(step, index))}
                    </View>
                </View>

                {/* Order Info */}
                <View style={styles.infoCard}>
                    <View style={styles.restaurantRow}>
                        <View style={styles.restaurantIcon}>
                            <Ionicons name="restaurant" size={24} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.restaurantName}>{order.restaurant?.name || 'Tienda'}</Text>
                            <Text style={styles.orderId}>Orden #{order.id.slice(0, 8)}</Text>
                        </View>
                        <View style={styles.totalBadge}>
                            <Text style={styles.totalText}>S/ {order.total.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.addressRow}>
                        <Ionicons name="location" size={20} color={COLORS.success} />
                        <Text style={styles.addressText} numberOfLines={2}>
                            {order.delivery_address}
                        </Text>
                    </View>
                </View>

                {/* Driver Info - Show when driver is assigned (from confirmed onwards) */}
                {order.driver_id && ['confirmed', 'preparing', 'ready', 'picked_up'].includes(order.status) && (
                    <View style={styles.driverCard}>
                        <View style={styles.driverInfo}>
                            <View style={styles.driverAvatar}>
                                <Ionicons name="person" size={24} color={COLORS.white} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.driverName}>
                                    {order.driver?.full_name || 'Repartidor asignado'}
                                </Text>
                                <Text style={styles.driverVehicle}>
                                    🏍️ {order.driver?.vehicle_type || 'Vehículo'} • {order.driver?.vehicle_plate || '---'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.chatButton}
                                onPress={() => navigation.navigate('Chat', {
                                    orderId: order.id,
                                    driverName: order.driver?.full_name || 'Repartidor',
                                })}
                            >
                                <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => {
                                    if (order.driver?.phone) {
                                        Linking.openURL(`tel:${order.driver.phone}`);
                                    } else {
                                        Alert.alert('Sin teléfono', 'El repartidor no tiene teléfono registrado');
                                    }
                                }}
                            >
                                <Ionicons name="call" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                {order.status === 'delivered' ? (
                    <>
                        <Button
                            title={hasRated ? "✓ Calificado" : "Calificar Pedido ⭐"}
                            onPress={() => !hasRated && setShowRatingModal(true)}
                            style={{ flex: 1, marginRight: 8, opacity: hasRated ? 0.6 : 1 }}
                            disabled={hasRated}
                        />
                        <Button
                            title="Inicio"
                            onPress={() => navigation.navigate('MainTabs')}
                            variant="outline"
                            style={{ flex: 0.5 }}
                        />
                    </>
                ) : (
                    <>
                        {/* Show cancel button only for pending/confirmed orders */}
                        {order && ['pending', 'confirmed'].includes(order.status) && (
                            <Button
                                title="Cancelar Pedido"
                                onPress={handleCancelOrder}
                                variant="outline"
                                style={{
                                    flex: 1,
                                    marginRight: 8,
                                    borderColor: COLORS.error,
                                }}
                                textStyle={{ color: COLORS.error }}
                            />
                        )}
                        <Button
                            title="Volver al Inicio"
                            onPress={() => navigation.navigate('MainTabs')}
                            variant="outline"
                            style={{ flex: 1, marginRight: 8 }}
                        />
                        <Button
                            title="Soporte"
                            onPress={() => Alert.alert('Soporte', 'Chat con soporte próximamente.')}
                            style={{ flex: 1 }}
                        />
                    </>
                )}
            </View>

            {/* Rating Modal */}
            {order && order.status === 'delivered' && (
                <RatingModal
                    visible={showRatingModal}
                    onClose={() => {
                        setShowRatingModal(false);
                        setHasRated(true);
                    }}
                    orderId={order.id}
                    restaurantId={order.restaurant_id}
                    restaurantName={order.restaurant?.name || 'Restaurante'}
                    driverId={order.driver_id || ''}
                    driverName={order.driver?.full_name || 'Repartidor'}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.md,
        backgroundColor: COLORS.white,
        ...SHADOWS.small,
        zIndex: 10,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    mapContainer: {
        height: MAP_HEIGHT,
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    storeMarker: {
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.white,
        ...SHADOWS.medium,
    },
    deliveryMarker: {
        backgroundColor: COLORS.success,
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.white,
        ...SHADOWS.medium,
    },
    driverMarker: {
        backgroundColor: COLORS.warning,
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.white,
        ...SHADOWS.medium,
    },
    statusOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        padding: SIZES.md,
        borderTopLeftRadius: SIZES.radiusLg,
        borderTopRightRadius: SIZES.radiusLg,
    },
    statusText: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
        textAlign: 'center',
    },
    etaText: {
        fontSize: SIZES.fontSm,
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '600',
    },
    stepsCard: {
        backgroundColor: COLORS.white,
        margin: SIZES.md,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        ...SHADOWS.small,
    },
    sectionTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: SIZES.sm,
    },
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stepContainer: {
        alignItems: 'center',
        flex: 1,
    },
    stepLeft: {
        alignItems: 'center',
    },
    stepIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray200,
    },
    stepIconCompleted: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
    },
    stepIconCancelled: {
        backgroundColor: COLORS.error,
        borderColor: COLORS.error,
    },
    stepLine: {
        width: '100%',
        height: 2,
        backgroundColor: COLORS.gray200,
        position: 'absolute',
        top: 15,
        left: '50%',
        zIndex: -1,
    },
    stepLineCompleted: {
        backgroundColor: COLORS.success,
    },
    stepRight: {
        marginTop: 4,
    },
    stepTitle: {
        fontSize: SIZES.fontXs,
        fontWeight: '600',
        color: COLORS.gray500,
        textAlign: 'center',
    },
    stepTitleCompleted: {
        color: COLORS.gray900,
        fontWeight: '700',
    },
    infoCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SIZES.md,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        ...SHADOWS.small,
    },
    restaurantRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    restaurantIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    restaurantName: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    orderId: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    totalBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: SIZES.radiusSm,
    },
    totalText: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.primary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: SIZES.sm,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addressText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray700,
        flex: 1,
    },
    driverCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SIZES.md,
        marginTop: SIZES.md,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        ...SHADOWS.small,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    driverName: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    driverVehicle: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    chatButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        padding: SIZES.md,
        paddingBottom: SIZES.lg,
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        ...SHADOWS.medium,
    },
});

export default OrderTrackingScreen;
