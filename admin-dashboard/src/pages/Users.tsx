import { useEffect, useState } from 'react';
import { Search, Eye, Ban, CheckCircle, Edit, X, Save, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    address?: string;
    is_active: boolean;
    created_at: string;
    role?: string;
    vehicle_type?: string;
    vehicle_plate?: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);
    const [filterRole, setFilterRole] = useState<string>('all');

    useEffect(() => {
        loadUsers();
    }, [search, filterRole]);

    const loadUsers = async () => {
        try {
            let query = supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (search) {
                query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
            }

            if (filterRole !== 'all') {
                query = query.eq('role', filterRole);
            }

            const { data, error } = await query;
            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !currentStatus })
                .eq('id', userId);

            if (error) throw error;
            loadUsers();
        } catch (error) {
            console.error('Error toggling user:', error);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser({ ...user });
        setSelectedUser(null);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: editingUser.full_name,
                    phone: editingUser.phone,
                    address: editingUser.address,
                    role: editingUser.role,
                    vehicle_type: editingUser.vehicle_type,
                    vehicle_plate: editingUser.vehicle_plate,
                })
                .eq('id', editingUser.id);

            if (error) throw error;
            loadUsers();
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error al actualizar usuario');
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadgeColor = (role?: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'driver': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const driversCount = users.filter(u => u.role === 'driver').length;
    const customersCount = users.filter(u => u.role !== 'driver' && u.role !== 'admin').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <div className="flex gap-4 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {driversCount} Repartidores
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                        {customersCount} Clientes
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                    <option value="all">Todos los roles</option>
                    <option value="customer">Clientes</option>
                    <option value="driver">Repartidores</option>
                    <option value="admin">Administradores</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-sm text-gray-500">
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Teléfono</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Vehículo</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Registrado</th>
                                <th className="px-6 py-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-t hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'driver' ? 'bg-blue-100' : 'bg-orange-100'
                                                }`}>
                                                {user.role === 'driver' ? (
                                                    <Truck className="text-blue-600" size={18} />
                                                ) : (
                                                    <span className="text-orange-600 font-medium">
                                                        {user.full_name?.charAt(0) || '?'}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.full_name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {user.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                            {user.role || 'customer'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {user.role === 'driver' ? (
                                            <span>
                                                {user.vehicle_type || '-'} • {user.vehicle_plate || '-'}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString('es-PE')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                title="Ver detalles"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => toggleUserStatus(user.id, user.is_active)}
                                                className={`p-2 rounded-lg ${user.is_active
                                                    ? 'text-red-500 hover:bg-red-50'
                                                    : 'text-green-500 hover:bg-green-50'
                                                    }`}
                                                title={user.is_active ? 'Desactivar' : 'Activar'}
                                            >
                                                {user.is_active ? <Ban size={18} /> : <CheckCircle size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedUser.role === 'driver' ? 'bg-blue-100' : 'bg-orange-100'
                                }`}>
                                {selectedUser.role === 'driver' ? (
                                    <Truck className="text-blue-600" size={28} />
                                ) : (
                                    <span className="text-2xl text-orange-600 font-bold">
                                        {selectedUser.full_name?.charAt(0) || '?'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">{selectedUser.full_name}</h3>
                                <p className="text-gray-500">{selectedUser.email}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Teléfono:</span>
                                <span className="font-medium">{selectedUser.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Dirección:</span>
                                <span className="font-medium text-right max-w-[200px]">
                                    {selectedUser.address || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Rol:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                                    {selectedUser.role || 'customer'}
                                </span>
                            </div>
                            {selectedUser.role === 'driver' && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Vehículo:</span>
                                        <span className="font-medium">{selectedUser.vehicle_type || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Placa:</span>
                                        <span className="font-medium">{selectedUser.vehicle_plate || 'N/A'}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500">Registrado:</span>
                                <span className="font-medium">
                                    {new Date(selectedUser.created_at).toLocaleDateString('es-PE')}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleEditUser(selectedUser)}
                                className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                            >
                                <Edit size={16} /> Editar
                            </button>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Editar Usuario</h3>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre completo
                                </label>
                                <input
                                    type="text"
                                    value={editingUser.full_name || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={editingUser.phone || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={editingUser.address || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rol
                                </label>
                                <select
                                    value={editingUser.role || 'customer'}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="customer">Cliente</option>
                                    <option value="driver">Repartidor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            {(editingUser.role === 'driver') && (
                                <>
                                    <div className="pt-2 border-t">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Truck size={16} /> Información del Vehículo
                                        </h4>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipo de vehículo
                                        </label>
                                        <select
                                            value={editingUser.vehicle_type || ''}
                                            onChange={(e) => setEditingUser({ ...editingUser, vehicle_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="Moto">Moto</option>
                                            <option value="Bicicleta">Bicicleta</option>
                                            <option value="Auto">Auto</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Placa del vehículo
                                        </label>
                                        <input
                                            type="text"
                                            value={editingUser.vehicle_plate || ''}
                                            onChange={(e) => setEditingUser({ ...editingUser, vehicle_plate: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="ABC-123"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSaveUser}
                                disabled={saving}
                                className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Save size={16} /> Guardar
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
