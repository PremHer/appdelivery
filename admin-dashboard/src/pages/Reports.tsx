// import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingBag, Users } from 'lucide-react';

const SALES_DATA = [
    { name: 'Lun', sales: 4000, orders: 24 },
    { name: 'Mar', sales: 3000, orders: 13 },
    { name: 'Mie', sales: 2000, orders: 98 },
    { name: 'Jue', sales: 2780, orders: 39 },
    { name: 'Vie', sales: 1890, orders: 48 },
    { name: 'Sab', sales: 2390, orders: 38 },
    { name: 'Dom', sales: 3490, orders: 43 },
];

const TOP_STORES = [
    { name: "Don Belisario", orders: 120, revenue: 4500 },
    { name: "Bembos", orders: 98, revenue: 3200 },
    { name: "Pardo's Chicken", orders: 86, revenue: 3100 },
    { name: "Starbucks", orders: 75, revenue: 1500 },
    { name: "KFC", orders: 65, revenue: 2100 },
];

export default function Reports() {
    // const [dateRange, setDateRange] = useState('week');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reportes y Analíticas</h1>
                    <p className="text-gray-500">Resumen de rendimiento del negocio</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Esta Semana</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                        <Download className="h-4 w-4" />
                        <span className="text-sm font-medium">Exportar CSV</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: 'Ventas Totales', value: 'S/ 24,500', icon: DollarSign, change: '+12.5%', color: 'green' },
                    { title: 'Órdenes', value: '1,240', icon: ShoppingBag, change: '+8.2%', color: 'blue' },
                    { title: 'Ticket Promedio', value: 'S/ 45.00', icon: TrendingUp, change: '-2.1%', color: 'red' },
                    { title: 'Nuevos Usuarios', value: '340', icon: Users, change: '+15.3%', color: 'purple' },
                ].map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                            </div>
                            <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                                <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                            </div>
                        </div>
                        <div className={`mt-4 text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                            {stat.change} <span className="text-gray-400 font-normal">vs periodo anterior</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tendencia de Ventas</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={SALES_DATA}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Top Restaurantes</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={TOP_STORES}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
