import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, TouchableOpacity, Alert, FlatList, RefreshControl } from 'react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../services/supabase';
import { Power, MapPin, Clock, DollarSign } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, savePushToken } from '../../services/pushNotifications';
import { Audio } from 'expo-av';

interface PendingOrder {
    id: string;
    status: string;
    total: number;
    delivery_fee: number;
    delivery_address: string;
    created_at: string;
    restaurant: {
        name: string;
        address: string;
    } | {
        name: string;
        address: string;
    }[];
}

export default function HomeScreen() {
    const { colors, isDark } = useTheme();
    const [stats, setStats] = useState({ earnings: 0, count: 0 });
    const [isOnline, setIsOnline] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [driverName, setDriverName] = useState<string>('');
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);
    const navigation = useNavigation();

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    useEffect(() => {
        checkStatus();
        fetchStats();

        // Listen for incoming notifications (while app is open)
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
            playSound();
            // Refresh orders when notification arrives
            loadPendingOrders();
        });

        // Handle notification tap
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.orderId) {
                (navigation as any).navigate('OrderDetail', { orderId: data.orderId });
            }
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    // Effect to start/stop tracking and load orders based on online status
    useEffect(() => {
        if (isOnline) {
            startTracking();
            registerPushNotifications();
            loadPendingOrders();

            // Subscribe to realtime order updates
            const subscription = supabase
                .channel('pending-orders')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                    loadPendingOrders();
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
                stopTracking();
            };
        } else {
            stopTracking();
            setPendingOrders([]);
        }
    }, [isOnline, userId]);

    const registerPushNotifications = async () => {
        if (!userId) return;
        const token = await registerForPushNotificationsAsync();
        if (token) {
            await savePushToken(userId, token);
        }
    };

    const loadPendingOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    status,
                    total,
                    delivery_fee,
                    delivery_address,
                    created_at,
                    restaurant:restaurants(name, address)
                `)
                .in('status', ['pending', 'confirmed', 'ready'])
                .is('driver_id', null)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error loading pending orders:', error);
            } else {
                setPendingOrders(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const playSound = async () => {
        try {
            // Updated to use remote URL to avoid build errors if local asset is missing
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }, // Simple bell sound
                { shouldPlay: true }
            );
            await sound.playAsync();
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch today's delivered orders for earnings and count
            const { data } = await supabase
                .from('orders')
                .select('delivery_fee')
                .eq('driver_id', user.id)
                .eq('status', 'delivered')
                .gte('updated_at', today.toISOString());

            const earnings = data?.reduce((sum, order) => sum + (order.delivery_fee || 0), 0) || 0;
            const count = data?.length || 0;

            setStats({ earnings, count });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const acceptOrder = async (orderId: string) => {
        if (!userId) return;

        try {
            // First check if order is still available
            const { data: orderCheck } = await supabase
                .from('orders')
                .select('driver_id, status')
                .eq('id', orderId)
                .single();

            if (orderCheck?.driver_id) {
                Alert.alert('Error', 'Este pedido ya fue tomado por otro repartidor');
                loadPendingOrders();
                return;
            }

            if (orderCheck?.status === 'cancelled') {
                Alert.alert('Error', 'Este pedido fue cancelado');
                loadPendingOrders();
                return;
            }

            // Now try to accept it
            const { error, data } = await supabase
                .from('orders')
                .update({ driver_id: userId, status: 'confirmed' })
                .eq('id', orderId)
                .is('driver_id', null)
                .select();

            if (error) {
                console.error('Error accepting order:', error);
                Alert.alert('Error', 'No se pudo aceptar el pedido. Intenta de nuevo.');
                return;
            }

            if (!data || data.length === 0) {
                Alert.alert('Error', 'Este pedido ya fue tomado por otro repartidor');
                loadPendingOrders();
                return;
            }

            Alert.alert('¡Éxito!', 'Pedido aceptado. Ve a recogerlo.');
            loadPendingOrders();
            (navigation as any).navigate('OrderDetail', { orderId });
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'No se pudo aceptar el pedido');
        }
    };

    const checkStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);

            // Get driver profile with name
            const { data } = await supabase
                .from('users')
                .select('full_name, is_available')
                .eq('id', user.id)
                .single();

            if (data) {
                setDriverName(data.full_name?.split(' ')[0] || 'Repartidor');
                setIsOnline(data.is_available || false);
            }

            // Also check driver_profiles for is_online
            const { data: driverProfile } = await supabase
                .from('driver_profiles')
                .select('is_online')
                .eq('user_id', user.id)
                .single();
            if (driverProfile) setIsOnline(driverProfile.is_online);
        }
    };

    const startTracking = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se requiere acceso a la ubicación para estar en línea.');
            setIsOnline(false);
            return;
        }

        const sub = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 10000,
                distanceInterval: 50
            },
            (location) => updateLocationInDB(location.coords)
        );
        setLocationSubscription(sub);
    };

    const stopTracking = () => {
        if (locationSubscription) {
            locationSubscription.remove();
            setLocationSubscription(null);
        }
    };

    const updateLocationInDB = async (coords: { latitude: number; longitude: number }) => {
        if (!userId) return;
        supabase.from('driver_profiles').update({
            current_latitude: coords.latitude,
            current_longitude: coords.longitude,
            location_updated_at: new Date().toISOString()
        }).eq('user_id', userId).then(({ error }) => {
            if (error) console.error('Error updating location:', error);
        });
    };

    const toggleSwitch = async () => {
        const newState = !isOnline;
        setIsOnline(newState);

        if (userId) {
            const { error } = await supabase
                .from('driver_profiles')
                .update({ is_online: newState })
                .eq('user_id', userId);

            if (error) {
                console.error('Error updating status:', error);
                setIsOnline(!newState);
                Alert.alert('Error', 'No se pudo actualizar el estado');
            }
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Error', error.message);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    };

    const renderOrderItem = ({ item }: { item: PendingOrder }) => (
        <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.orderHeader}>
                <Text style={[styles.restaurantName, { color: colors.text }]}>{(item.restaurant as any)?.name || 'Restaurante'}</Text>
                <View style={[styles.timeBadge, { backgroundColor: colors.background }]}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(item.created_at)}</Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                    <MapPin size={16} color={COLORS.primary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>{item.delivery_address}</Text>
                </View>
                <View style={styles.detailRow}>
                    <DollarSign size={16} color={COLORS.success} />
                    <Text style={styles.earningsText}>Ganas: S/{item.delivery_fee?.toFixed(2) || '5.00'}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => acceptOrder(item.id)}
            >
                <Text style={styles.acceptButtonText}>ACEPTAR PEDIDO</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                {/* Welcome Message */}
                <View style={styles.welcomeSection}>
                    <Text style={[styles.greetingText, { color: colors.textSecondary }]}>{getGreeting()},</Text>
                    <Text style={[styles.driverNameText, { color: colors.text }]}>{driverName || 'Repartidor'} 👋</Text>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                        {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                </View>

                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { color: isOnline ? COLORS.success : colors.textSecondary }]}>
                        {isOnline ? 'EN LÍNEA' : 'FUERA DE LÍNEA'}
                    </Text>
                    <Switch
                        trackColor={{ true: COLORS.success, false: colors.border }}
                        thumbColor={COLORS.white}
                        onValueChange={toggleSwitch}
                        value={isOnline}
                    />
                </View>
                <TouchableOpacity onPress={handleLogout} style={[styles.logoutButton, { backgroundColor: colors.background }]}>
                    <Power color={COLORS.error} size={24} />
                </TouchableOpacity>
            </View>

            {/* Dashboard Stats */}
            {isOnline && (
                <View style={[styles.statsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ganancias Hoy</Text>
                        <Text style={[styles.statValue, { color: COLORS.success }]}>S/ {stats.earnings.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Entregas Hoy</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.count}</Text>
                    </View>
                </View>
            )}

            {/* Pending Orders List */}
            <View style={styles.ordersContainer}>
                {isOnline ? (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Pedidos Disponibles ({pendingOrders.length})
                        </Text>
                        <FlatList
                            data={pendingOrders}
                            keyExtractor={(item) => item.id}
                            renderItem={renderOrderItem}
                            contentContainerStyle={styles.listContent}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={() => {
                                        setRefreshing(true);
                                        loadPendingOrders().finally(() => setRefreshing(false));
                                    }}
                                    colors={[COLORS.primary]}
                                />
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <View style={[styles.emptyIcon, { backgroundColor: colors.border }]}>
                                        <Clock size={40} color={colors.textSecondary} />
                                    </View>
                                    <Text style={[styles.emptyText, { color: colors.text }]}>No hay pedidos disponibles</Text>
                                    <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Los nuevos pedidos aparecerán aquí</Text>
                                </View>
                            }
                        />
                    </>
                ) : (
                    <View style={styles.offlineContainer}>
                        <View style={[styles.offlineIcon, { backgroundColor: colors.border }]}>
                            <Power size={40} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.offlineTitle, { color: colors.text }]}>Estás desconectado</Text>
                        <Text style={[styles.offlineSubtitle, { color: colors.textSecondary }]}>
                            Conéctate para empezar a recibir pedidos cercanos
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusText: { fontWeight: 'bold', fontSize: 16 },
    logoutButton: { padding: 8 },
    ordersContainer: { flex: 1 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.gray700,
        padding: 16,
        paddingBottom: 8,
    },
    listContent: { padding: 16, paddingTop: 0 },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    restaurantName: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray800 },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    timeText: { fontSize: 12, color: COLORS.gray500 },
    orderDetails: { gap: 8, marginBottom: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { flex: 1, color: COLORS.gray600, fontSize: 14 },
    earningsText: { color: COLORS.success, fontWeight: 'bold', fontSize: 14 },
    acceptButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    acceptButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: COLORS.gray500 },
    emptySubtext: { fontSize: 14, color: COLORS.gray400, marginTop: 4 },
    welcomeSection: { flex: 1 },
    offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    offlineIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.gray200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    offlineTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray800, marginBottom: 8 },
    offlineSubtitle: { fontSize: 16, color: COLORS.gray500, textAlign: 'center' },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    greetingText: { fontSize: 14, color: COLORS.gray600 },
    driverNameText: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray800 },
    dateText: { fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, color: COLORS.gray500, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray800 },
    statDivider: { width: 1, height: '100%', backgroundColor: COLORS.gray200 },
});
