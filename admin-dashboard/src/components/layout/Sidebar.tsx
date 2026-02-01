import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Store,
    Package,
    Users,
    Truck,
    BarChart3,
    Tag,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'Pedidos', icon: ShoppingBag },
    { path: '/restaurants', label: 'Tiendas', icon: Store },
    { path: '/products', label: 'Productos', icon: Package },
    { path: '/users', label: 'Usuarios', icon: Users },
    { path: '/drivers', label: 'Repartidores', icon: Truck },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/coupons', label: 'Cupones', icon: Tag },
];

export default function Sidebar() {
    const { logout } = useAuthStore();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold text-orange-500">
                    🛵 Delivery Admin
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-orange-500 text-white'
                                        : 'text-gray-300 hover:bg-gray-800'
                                    }`
                                }
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
