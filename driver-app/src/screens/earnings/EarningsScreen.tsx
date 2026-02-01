import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, TrendingUp, Package, Star, Wallet } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants';
import { supabase } from '../../services/supabase';

interface EarningsData {
    today: { deliveries: number; earnings: number };
    week: { deliveries: number; earnings: number };
    month: { deliveries: number; earnings: number };
    total: { deliveries: number; earnings: number };
    recentDeliveries: Array<{
        id: string;
        created_at: string;
        total: number;
        restaurant_name: string;
        delivery_address: string;
    }>;
    rating: { average: number; count: number };
}

const DELIVERY_FEE = 5.00; // Base delivery fee per order

export default function EarningsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'total'>('today');
    const [data, setData] = useState<EarningsData>({
        today: { deliveries: 0, earnings: 0 },
        week: { deliveries: 0, earnings: 0 },
        month: { deliveries: 0, earnings: 0 },
        total: { deliveries: 0, earnings: 0 },
        recentDeliveries: [],
        rating: { average: 0, count: 0 },
    });

    useEffect(() => {
        loadEarnings();
    }, []);

    const loadEarnings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

            // Fetch all delivered orders for this driver
            const { data: orders, error } = await supabase
                .from('orders')
                .select('id, created_at, total, delivery_address, restaurant:restaurants(name)')
                .eq('driver_id', user.id)
                .eq('status', 'delivered')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculate earnings by period
            const calculatePeriod = (startDate: string) => {
                const filtered = orders?.filter(o => o.created_at >= startDate) || [];
                return {
                    deliveries: filtered.length,
                    earnings: filtered.length * DELIVERY_FEE,
                };
            };

            // Get ratings
            const { data: ratings } = await supabase
                .from('ratings')
                .select('driver_rating')
                .eq('driver_id', user.id)
                .not('driver_rating', 'is', null);

            const avgRating = ratings?.length
                ? ratings.reduce((sum, r) => sum + r.driver_rating, 0) / ratings.length
                : 0;

            setData({
                today: calculatePeriod(todayStart),
                week: calculatePeriod(weekStart),
                month: calculatePeriod(monthStart),
                total: {
                    deliveries: orders?.length || 0,
                    earnings: (orders?.length || 0) * DELIVERY_FEE,
                },
                recentDeliveries: (orders || []).slice(0, 10).map(o => ({
                    id: o.id,
                    created_at: o.created_at,
                    total: o.total,
                    restaurant_name: (o.restaurant as any)?.name || 'Restaurante',
                    delivery_address: o.delivery_address,
                })),
                rating: {
                    average: Math.round(avgRating * 10) / 10,
                    count: ratings?.length || 0,
                },
            });
        } catch (error) {
            console.error('Error loading earnings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadEarnings();
    };

    const formatCurrency = (amount: number) => `S/ ${amount.toFixed(2)}`;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const periodData = data[period];
    const periodLabels = {
        today: 'Hoy',
        week: 'Semana',
        month: 'Mes',
        total: 'Total',
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Mis Ganancias</Text>
                    <View style={styles.ratingBadge}>
                        <Star size={16} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingText}>
                            {data.rating.average > 0 ? data.rating.average.toFixed(1) : '-'}
                        </Text>
                    </View>
                </View>

                {/* Period Tabs */}
                <View style={styles.periodTabs}>
                    {(['today', 'week', 'month', 'total'] as const).map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.periodTab, period === p && styles.periodTabActive]}
                            onPress={() => setPeriod(p)}
                        >
                            <Text
                                style={[
                                    styles.periodTabText,
                                    period === p && styles.periodTabTextActive,
                                ]}
                            >
                                {periodLabels[p]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Main Stats Card */}
                <View style={styles.mainCard}>
                    <View style={styles.earningsCircle}>
                        <Wallet size={32} color={COLORS.primary} />
                    </View>
                    <Text style={styles.earningsAmount}>
                        {formatCurrency(periodData.earnings)}
                    </Text>
                    <Text style={styles.earningsLabel}>
                        Ganancias {periodLabels[period].toLowerCase()}
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Package size={20} color={COLORS.success} />
                            <Text style={styles.statValue}>{periodData.deliveries}</Text>
                            <Text style={styles.statLabel}>Entregas</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <TrendingUp size={20} color={COLORS.primary} />
                            <Text style={styles.statValue}>{formatCurrency(DELIVERY_FEE)}</Text>
                            <Text style={styles.statLabel}>Por entrega</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                    <View style={styles.quickStatCard}>
                        <Text style={styles.quickStatValue}>{data.today.deliveries}</Text>
                        <Text style={styles.quickStatLabel}>Hoy</Text>
                    </View>
                    <View style={styles.quickStatCard}>
                        <Text style={styles.quickStatValue}>{data.week.deliveries}</Text>
                        <Text style={styles.quickStatLabel}>Semana</Text>
                    </View>
                    <View style={styles.quickStatCard}>
                        <Text style={styles.quickStatValue}>{data.month.deliveries}</Text>
                        <Text style={styles.quickStatLabel}>Mes</Text>
                    </View>
                    <View style={styles.quickStatCard}>
                        <Text style={styles.quickStatValue}>{data.total.deliveries}</Text>
                        <Text style={styles.quickStatLabel}>Total</Text>
                    </View>
                </View>

                {/* Recent Deliveries */}
                <View style={styles.recentSection}>
                    <Text style={styles.sectionTitle}>Entregas Recientes</Text>

                    {data.recentDeliveries.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Package size={48} color={COLORS.gray300} />
                            <Text style={styles.emptyText}>No hay entregas aún</Text>
                        </View>
                    ) : (
                        data.recentDeliveries.map((delivery) => (
                            <View key={delivery.id} style={styles.deliveryCard}>
                                <View style={styles.deliveryInfo}>
                                    <Text style={styles.deliveryRestaurant}>
                                        {delivery.restaurant_name}
                                    </Text>
                                    <Text style={styles.deliveryAddress} numberOfLines={1}>
                                        {delivery.delivery_address}
                                    </Text>
                                    <Text style={styles.deliveryDate}>
                                        {formatDate(delivery.created_at)}
                                    </Text>
                                </View>
                                <View style={styles.deliveryEarnings}>
                                    <Text style={styles.deliveryAmount}>
                                        +{formatCurrency(DELIVERY_FEE)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.gray700,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
        ...SHADOWS.small,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray700,
    },
    periodTabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    periodTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: COLORS.gray100,
        alignItems: 'center',
    },
    periodTabActive: {
        backgroundColor: COLORS.primary,
    },
    periodTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.gray500,
    },
    periodTabTextActive: {
        color: COLORS.white,
    },
    mainCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    earningsCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    earningsAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: COLORS.gray700,
    },
    earningsLabel: {
        fontSize: 14,
        color: COLORS.gray500,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.gray200,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.gray700,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    quickStats: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 16,
        gap: 8,
    },
    quickStatCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        ...SHADOWS.small,
    },
    quickStatValue: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.success,
    },
    quickStatLabel: {
        fontSize: 11,
        color: COLORS.gray500,
        marginTop: 2,
    },
    recentSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.gray700,
        marginBottom: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.gray400,
    },
    deliveryCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        ...SHADOWS.small,
    },
    deliveryInfo: {
        flex: 1,
    },
    deliveryRestaurant: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.gray700,
    },
    deliveryAddress: {
        fontSize: 13,
        color: COLORS.gray500,
        marginTop: 2,
    },
    deliveryDate: {
        fontSize: 12,
        color: COLORS.gray400,
        marginTop: 4,
    },
    deliveryEarnings: {
        justifyContent: 'center',
    },
    deliveryAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.success,
    },
});
