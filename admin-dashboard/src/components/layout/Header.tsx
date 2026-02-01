import { Bell, Search, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function Header() {
    const { user } = useAuthStore();

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Search */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar pedidos, tiendas, usuarios..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User */}
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                            <User size={18} className="text-orange-600" />
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-medium text-gray-700">
                                {user?.full_name || 'Admin'}
                            </p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
