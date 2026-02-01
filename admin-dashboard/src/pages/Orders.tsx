import { useEffect, useState } from 'react';
import { Eye, Filter, RefreshCw, MapPin, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TrackingMap from '../components/TrackingMap';

interface Order {
    id: string;
    total: number;
    status: string;
    payment_method: string;
    delivery_address: string;
    created_at: string;
    restaurant?: { name: string };
    user?: { full_name: string; email: string };
}

const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'ready', label: 'Listo' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' },
];

export default function Orders() {
    const [drivers, setDrivers] = useState<{ id: string, full_name: string, location?: { lat: number, lng: number } }[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        loadOrders();
        loadDrivers();

        // Subscribe to orders and driver_profiles changes
        const channel = supabase
            .channel('dashboard-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => loadOrders()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'driver_profiles' },
                () => loadDrivers()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [statusFilter]);

    const loadDrivers = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, full_name, driver_profiles!inner(is_online, current_latitude, current_longitude)')
            .eq('role', 'driver')
            .eq('is_active', true)
            .eq('driver_profiles.is_online', true);

        if (data) {
            setDrivers(data.map(d => ({
                id: d.id,
                full_name: d.full_name,
                location: (d.driver_profiles as any)?.current_latitude ? {
                    lat: (d.driver_profiles as any).current_latitude,
                    lng: (d.driver_profiles as any).current_longitude
                } : undefined
            })));
        }
    };

    const loadOrders = async () => {
        try {
            let query = supabase
                .from('orders')
                .select('*, restaurant:restaurants(name, latitude, longitude), user:users!user_id(full_name, email), driver:users!driver_id(full_name)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (statusFilter) {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrder = async (orderId: string, updates: any) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            if (error) throw error;
            loadOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

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
        return statusOptions.find(s => s.value === status)?.label || status;
    };

    const getDriverLocation = (driverId?: string) => {
        const driver = drivers.find(d => d.id === driverId);
        return driver?.location;
    };

    // Export orders to CSV
    const exportToCSV = () => {
        const headers = ['ID', 'Fecha', 'Cliente', 'Email', 'Restaurante', 'Estado', 'Dirección', 'Total', 'Método de Pago'];
        const csvData = orders.map(o => [
            o.id,
            new Date(o.created_at).toLocaleString('es-PE'),
            o.user?.full_name || 'Cliente',
            o.user?.email || '',
            o.restaurant?.name || '',
            getStatusLabel(o.status),
            `"${o.delivery_address.replace(/"/g, '""')}"`,
            `S/${o.total.toFixed(2)}`,
            o.payment_method || 'efectivo',
        ]);

        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h1>
                <button
                    onClick={() => loadOrders()}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    <RefreshCw size={18} />
                    <span>Actualizar</span>
                </button>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={orders.length === 0}
                >
                    <Download size={18} />
                    <span>Exportar CSV</span>
                </button>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <Filter size={20} className="text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-sm text-gray-500">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Tienda</th>
                                <th className="px-6 py-4">Repartidor</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-t hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-sm">
                                        #{order.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium">{(order.user as any)?.full_name || 'N/A'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(order.restaurant as any)?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm ${(order as any).driver ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                            {(order as any).driver?.full_name || 'Sin asignar'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        S/ {order.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                            title="Ver Detalles"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {(order.status === 'picked_up' || order.status === 'ready') && (order as any).driver_id && (
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                title="Rastrear en Mapa"
                                            >
                                                <MapPin size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">
                                Pedido #{selectedOrder.id.slice(0, 8)}
                            </h3>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-gray-500 text-sm">Cliente:</span>
                                    <p className="font-medium">{(selectedOrder.user as any)?.full_name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-sm">Dirección:</span>
                                    <p className="font-medium">{selectedOrder.delivery_address}</p>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">
                                        Repartidor Asignado:
                                    </label>
                                    <select
                                        value={(selectedOrder as any).driver_id || ''}
                                        onChange={(e) => updateOrder(selectedOrder.id, { driver_id: e.target.value || null })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="">-- Sin Asignar --</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id}>{d.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border-t pt-2 mt-2">
                                    <span className="text-gray-500 text-sm">Estado:</span>
                                    <select
                                        value={selectedOrder.status}
                                        onChange={(e) => updateOrder(selectedOrder.id, { status: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                                    >
                                        {statusOptions.filter(s => s.value).map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="h-[400px] w-full bg-gray-100 rounded-xl overflow-hidden">
                                <TrackingMap
                                    restaurant={selectedOrder.restaurant ? {
                                        lat: (selectedOrder.restaurant as any).latitude || -6.0,
                                        lng: (selectedOrder.restaurant as any).longitude || -77.0,
                                        label: (selectedOrder.restaurant as any)?.name
                                    } : undefined}
                                    customer={{
                                        lat: (selectedOrder as any).delivery_latitude || -12.0,
                                        lng: (selectedOrder as any).delivery_longitude || -77.0,
                                        label: (selectedOrder.user as any)?.full_name
                                    }}
                                    driver={getDriverLocation((selectedOrder as any).driver_id) ? {
                                        ...getDriverLocation((selectedOrder as any).driver_id)!,
                                        label: (selectedOrder as any).driver?.full_name
                                    } : undefined}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
