import { useEffect, useState } from 'react';
import {
    ShoppingBag,
    DollarSign,
    Store,
    Users,
    TrendingUp,
    Clock
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { supabase } from '../lib/supabase';

interface Stats {
    totalOrders: number;
    revenue: number;
    activeStores: number;
    totalUsers: number;
}

interface RecentOrder {
    id: string;
    total: number;
    status: string;
    created_at: string;
    restaurant?: { name: string };
}

const mockChartData = [
    { name: 'Lun', pedidos: 45, ingresos: 1250 },
    { name: 'Mar', pedidos: 52, ingresos: 1480 },
    { name: 'Mié', pedidos: 38, ingresos: 980 },
    { name: 'Jue', pedidos: 65, ingresos: 1820 },
    { name: 'Vie', pedidos: 78, ingresos: 2150 },
    { name: 'Sáb', pedidos: 92, ingresos: 2680 },
    { name: 'Dom', pedidos: 85, ingresos: 2420 },
];

export default function Dashboard() {
    const [stats, setStats] = useState<Stats>({
        totalOrders: 0,
        revenue: 0,
        activeStores: 0,
        totalUsers: 0,
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Get total orders today
            const today = new Date().toISOString().split('T')[0];
            const { count: ordersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today);

            // Get total revenue
            const { data: revenueData } = await supabase
                .from('orders')
                .select('total')
                .gte('created_at', today);
            const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

            // Get active stores
            const { count: storesCount } = await supabase
                .from('restaurants')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // Get total users
            const { count: usersCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalOrders: ordersCount || 0,
                revenue: totalRevenue,
                activeStores: storesCount || 0,
                totalUsers: usersCount || 0,
            });

            // Get recent orders
            const { data: orders } = await supabase
                .from('orders')
                .select('id, total, status, created_at, restaurant:restaurants(name)')
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentOrders(orders || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Pedidos Hoy',
            value: stats.totalOrders,
            icon: ShoppingBag,
            color: 'bg-blue-500',
            change: '+12%'
        },
        {
            label: 'Ingresos Hoy',
            value: `S/ ${stats.revenue.toFixed(2)}`,
            icon: DollarSign,
            color: 'bg-green-500',
            change: '+8%'
        },
        {
            label: 'Tiendas Activas',
            value: stats.activeStores,
            icon: Store,
            color: 'bg-orange-500',
            change: '+2'
        },
        {
            label: 'Usuarios',
            value: stats.totalUsers,
            icon: Users,
            color: 'bg-purple-500',
            change: '+24'
        },
    ];

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            preparing: 'bg-orange-100 text-orange-800',
            ready: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pendiente',
            confirmed: 'Confirmado',
            preparing: 'Preparando',
            ready: 'Listo',
            delivered: 'Entregado',
            cancelled: 'Cancelado',
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={16} />
                    <span>Actualizado hace 1 min</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg`}>
                                <stat.icon size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-4 text-sm">
                            <TrendingUp size={16} className="text-green-500" />
                            <span className="text-green-500 font-medium">{stat.change}</span>
                            <span className="text-gray-500">vs ayer</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Pedidos por Día</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={mockChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="pedidos" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingresos por Día</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={mockChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="ingresos"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={{ fill: '#22c55e' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pedidos Recientes</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 border-b">
                                <th className="pb-3">ID</th>
                                <th className="pb-3">Tienda</th>
                                <th className="pb-3">Total</th>
                                <th className="pb-3">Estado</th>
                                <th className="pb-3">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="border-b last:border-0">
                                    <td className="py-3 font-mono text-sm">
                                        #{order.id.slice(0, 8)}
                                    </td>
                                    <td className="py-3">
                                        {(order.restaurant as any)?.name || 'N/A'}
                                    </td>
                                    <td className="py-3 font-medium">
                                        S/ {order.total.toFixed(2)}
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 text-sm text-gray-500">
                                        {new Date(order.created_at).toLocaleString('es-PE')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
