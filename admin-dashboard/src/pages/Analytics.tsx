import { useEffect, useState } from 'react';
import {
    TrendingUp,
    ShoppingBag,
    DollarSign,
    Users,
    Package,
    Star,
    Truck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DayData {
    date: string;
    orders: number;
    revenue: number;
}

interface TopProduct {
    name: string;
    quantity: number;
    restaurant: string;
}

interface TopRestaurant {
    name: string;
    orders: number;
    revenue: number;
}

interface DriverStats {
    name: string;
    deliveries: number;
    rating: number;
}

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

    // KPIs
    const [todayOrders, setTodayOrders] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [avgOrderValue, setAvgOrderValue] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);

    // Charts data
    const [dailyData, setDailyData] = useState<DayData[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([]);
    const [driverStats, setDriverStats] = useState<DriverStats[]>([]);

    useEffect(() => {
        loadAnalytics();
    }, [period]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadKPIs(),
                loadDailyData(),
                loadTopProducts(),
                loadTopRestaurants(),
                loadDriverStats(),
            ]);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadKPIs = async () => {
        const today = new Date().toISOString().split('T')[0];

        // Today's orders
        const { data: todayData } = await supabase
            .from('orders')
            .select('id, total')
            .gte('created_at', today)
            .neq('status', 'cancelled');

        setTodayOrders(todayData?.length || 0);
        setTodayRevenue(todayData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0);

        // Total orders
        const { data: totalData } = await supabase
            .from('orders')
            .select('id, total')
            .neq('status', 'cancelled');

        setTotalOrders(totalData?.length || 0);
        const total = totalData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        setTotalRevenue(total);
        setAvgOrderValue(totalData?.length ? total / totalData.length : 0);

        // Total users
        const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .eq('role', 'customer');

        setTotalUsers(count || 0);
    };

    const loadDailyData = async () => {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data } = await supabase
            .from('orders')
            .select('created_at, total')
            .gte('created_at', startDate.toISOString())
            .neq('status', 'cancelled');

        // Group by date
        const grouped: Record<string, DayData> = {};

        // Initialize all days
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            grouped[key] = { date: key, orders: 0, revenue: 0 };
        }

        // Fill actual data
        data?.forEach((order) => {
            const date = order.created_at.split('T')[0];
            if (grouped[date]) {
                grouped[date].orders += 1;
                grouped[date].revenue += order.total || 0;
            }
        });

        // Sort by date ascending
        const sortedData = Object.values(grouped).sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setDailyData(sortedData.slice(-7)); // Last 7 days for chart
    };

    const loadTopProducts = async () => {
        const { data } = await supabase
            .from('order_items')
            .select(`
                quantity,
                product:products(name, restaurant:restaurants(name))
            `)
            .limit(100);

        // Aggregate by product
        const productMap: Record<string, TopProduct> = {};
        data?.forEach((item: any) => {
            const name = item.product?.name || 'Unknown';
            const restaurant = item.product?.restaurant?.name || 'Unknown';
            if (!productMap[name]) {
                productMap[name] = { name, quantity: 0, restaurant };
            }
            productMap[name].quantity += item.quantity || 1;
        });

        const sorted = Object.values(productMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        setTopProducts(sorted);
    };

    const loadTopRestaurants = async () => {
        const { data } = await supabase
            .from('orders')
            .select(`
                total,
                restaurant:restaurants(name)
            `)
            .neq('status', 'cancelled')
            .limit(200);

        // Aggregate by restaurant
        const restaurantMap: Record<string, TopRestaurant> = {};
        data?.forEach((order: any) => {
            const name = order.restaurant?.name || 'Unknown';
            if (!restaurantMap[name]) {
                restaurantMap[name] = { name, orders: 0, revenue: 0 };
            }
            restaurantMap[name].orders += 1;
            restaurantMap[name].revenue += order.total || 0;
        });

        const sorted = Object.values(restaurantMap)
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5);

        setTopRestaurants(sorted);
    };

    const loadDriverStats = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('role', 'driver')
            .limit(10);

        const stats: DriverStats[] = [];

        for (const driver of data || []) {
            // Count deliveries
            const { count } = await supabase
                .from('orders')
                .select('id', { count: 'exact' })
                .eq('driver_id', driver.id)
                .eq('status', 'delivered');

            // Get average rating
            const { data: ratings } = await supabase
                .from('ratings')
                .select('driver_rating')
                .eq('driver_id', driver.id)
                .not('driver_rating', 'is', null);

            const avgRating = ratings?.length
                ? ratings.reduce((sum, r) => sum + r.driver_rating, 0) / ratings.length
                : 0;

            stats.push({
                name: driver.full_name || 'Sin nombre',
                deliveries: count || 0,
                rating: Math.round(avgRating * 10) / 10,
            });
        }

        setDriverStats(stats.sort((a, b) => b.deliveries - a.deliveries));
    };

    const formatCurrency = (value: number) => {
        return `S/ ${value.toFixed(2)}`;
    };

    const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
                <div className="flex gap-2">
                    {(['7d', '30d', 'all'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === p
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {p === '7d' ? '7 días' : p === '30d' ? '30 días' : 'Todo'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <ShoppingBag className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pedidos Hoy</p>
                            <p className="text-2xl font-bold">{todayOrders}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ventas Hoy</p>
                            <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Promedio por Pedido</p>
                            <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Users className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Clientes</p>
                            <p className="text-2xl font-bold">{totalUsers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100">Total Pedidos</p>
                            <p className="text-4xl font-bold mt-1">{totalOrders}</p>
                        </div>
                        <Package size={48} className="opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100">Ingresos Totales</p>
                            <p className="text-4xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <DollarSign size={48} className="opacity-50" />
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Ventas (Últimos 7 días)</h2>
                    <div className="flex items-end gap-2 h-48">
                        {dailyData.map((day, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-orange-500 rounded-t transition-all hover:bg-orange-600"
                                    style={{
                                        height: `${(day.revenue / maxRevenue) * 100}%`,
                                        minHeight: day.revenue > 0 ? '8px' : '0'
                                    }}
                                    title={`${formatCurrency(day.revenue)}`}
                                />
                                <div className="mt-2 text-xs text-gray-500">
                                    {new Date(day.date).toLocaleDateString('es-PE', { weekday: 'short' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Top 5 Productos</h2>
                    <div className="space-y-3">
                        {topProducts.map((product, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <span className="text-orange-600 font-bold text-sm">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{product.name}</p>
                                    <p className="text-xs text-gray-500">{product.restaurant}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-800">{product.quantity}</p>
                                    <p className="text-xs text-gray-500">vendidos</p>
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <p className="text-gray-500 text-sm text-center py-4">No hay datos</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Restaurants */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Top 5 Restaurantes</h2>
                    <div className="space-y-3">
                        {topRestaurants.map((restaurant, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{restaurant.name}</p>
                                    <p className="text-xs text-gray-500">{restaurant.orders} pedidos</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">{formatCurrency(restaurant.revenue)}</p>
                                </div>
                            </div>
                        ))}
                        {topRestaurants.length === 0 && (
                            <p className="text-gray-500 text-sm text-center py-4">No hay datos</p>
                        )}
                    </div>
                </div>

                {/* Driver Stats */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Rendimiento Repartidores</h2>
                    <div className="space-y-3">
                        {driverStats.map((driver, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Truck className="text-blue-600" size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{driver.name}</p>
                                    <p className="text-xs text-gray-500">{driver.deliveries} entregas</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="text-yellow-500" size={16} fill="currentColor" />
                                    <span className="font-bold text-gray-800">
                                        {driver.rating > 0 ? driver.rating.toFixed(1) : '-'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {driverStats.length === 0 && (
                            <p className="text-gray-500 text-sm text-center py-4">No hay repartidores</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
