import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { Search, Filter, MoreVertical, Bike, Car, X, Plus } from 'lucide-react';

interface Driver {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    avatar_url: string;
    is_active: boolean;
    role: string;
    driver_profile?: {
        vehicle_type: 'moto' | 'bicycle' | 'car';
        license_plate: string;
        verification_status: 'pending' | 'verified' | 'rejected';
        is_online: boolean;
        rating: number;
        total_deliveries: number;
    };
}

export default function Drivers() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified'>('all');

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newDriver, setNewDriver] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        vehicleType: 'moto',
        licensePlate: ''
    });

    const handleCreateDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Secondary client to avoid logging out admin
            const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: { persistSession: false }
            });

            // 1. Create Auth User
            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: newDriver.email.trim(),
                password: newDriver.password,
                options: {
                    data: {
                        full_name: newDriver.fullName.trim(),
                        phone: newDriver.phone.trim(),
                        role: 'driver' // Metadata hint
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('No se pudo crear el usuario');

            const userId = authData.user.id;

            // 2. Wait for trigger to create public user (Retry Loop)
            let existingUser = null;
            for (let i = 0; i < 5; i++) {
                const { data } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
                if (data) {
                    existingUser = data;
                    break;
                }
                await new Promise(r => setTimeout(r, 1000));
            }

            if (!existingUser) {
                console.warn('User sync timeout. Trigger might be slow or failed.');
                // Optimization: If trigger failed, we could try manual insert here if we had permissions,
                // but since we don't, we just proceed and hope the update/upsert works or throws meaningful error.
                // Assuming RLS on update might also fail if row doesn't exist? 
                // Actually if row doesn't exist, update does nothing (no error).
                // Let's throw error to alert user.
                throw new Error('El sistema tardó demasiado en sincronizar el usuario. Por favor intenta de nuevo en unos segundos o verifica si se creó.');
            }

            // Update existing user role
            await supabase.from('users').update({ role: 'driver', is_active: true }).eq('id', userId);

            // 3. Create Profile (Upsert to avoid Race Condition)

            // 3. Create Profile (Upsert to avoid Race Condition)
            const { error: profileError } = await supabase.from('driver_profiles').upsert({
                user_id: userId,
                vehicle_type: newDriver.vehicleType,
                license_plate: newDriver.licensePlate,
                verification_status: 'verified',
                is_online: false
            });

            if (profileError) throw profileError;

            // Success
            setIsCreateModalOpen(false);
            setNewDriver({ email: '', password: '', fullName: '', phone: '', vehicleType: 'moto', licensePlate: '' });
            fetchDrivers();
            alert('Repartidor creado exitosamente');

        } catch (error: any) {
            console.error('Error creating driver:', error);
            alert('Error al crear repartidor: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            // Fetch users with role 'driver' and their profile
            // Note: This relies on the Foreign Key relationship being detected by PostgREST
            const { data, error } = await supabase
                .from('users')
                .select(`
          *,
          driver_profile:driver_profiles(*)
        `)
                .eq('role', 'driver')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDrivers(data || []);
        } catch (error) {
            console.error('Error fetching drivers:', error);
            // Fallback: mock data or empty if table doesn't exist
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchDrivers();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const verifyDriver = async (userId: string, status: 'verified' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('driver_profiles')
                .update({ verification_status: status })
                .eq('user_id', userId);

            if (error) throw error;
            fetchDrivers();
        } catch (error) {
            console.error('Error verifying driver:', error);
        }
    };

    const filteredDrivers = drivers.filter(driver => {
        const matchesSearch = driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || driver.driver_profile?.verification_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getVehicleIcon = (type?: string) => {
        switch (type) {
            case 'car': return <Car className="h-4 w-4" />;
            case 'moto': return <Bike className="h-4 w-4" />;
            default: return <Bike className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Repartidores</h1>
                    <p className="text-gray-500">Gestión de flota y solicitudes</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                    <Plus size={20} />
                    Nuevo Repartidor
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                        className="bg-transparent border-none focus:ring-0 text-gray-600 py-2"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="verified">Verificados</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Repartidor</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Vehículo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Verificación</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Entregas</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estado Cuenta</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Cargando repartidores...
                                    </td>
                                </tr>
                            ) : filteredDrivers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron resultados
                                    </td>
                                </tr>
                            ) : (
                                filteredDrivers.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-medium">
                                                    {driver.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{driver.full_name}</div>
                                                    <div className="text-sm text-gray-500">{driver.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                {getVehicleIcon(driver.driver_profile?.vehicle_type)}
                                                <span className="capitalize">{driver.driver_profile?.vehicle_type || 'N/A'}</span>
                                            </div>
                                            <div className="text-xs text-gray-400">{driver.driver_profile?.license_plate || 'Sin placa'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.driver_profile?.verification_status)}`}>
                                                {driver.driver_profile?.verification_status === 'verified' ? 'Verificado' :
                                                    driver.driver_profile?.verification_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {driver.driver_profile?.total_deliveries || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {driver.driver_profile?.verification_status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => verifyDriver(driver.id, 'verified')}
                                                            className="text-green-600 hover:text-green-800 text-xs font-bold border border-green-200 px-2 py-1 rounded"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => verifyDriver(driver.id, 'rejected')}
                                                            className="text-red-600 hover:text-red-800 text-xs font-bold border border-red-200 px-2 py-1 rounded"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => toggleStatus(driver.id, driver.is_active)}
                                                    className={`font-medium text-sm ${driver.is_active ? 'text-blue-600' : 'text-gray-500'}`}
                                                >
                                                    {driver.is_active ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Create Modal */}
            {
                isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Registrar Repartidor</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateDriver} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        value={newDriver.fullName}
                                        onChange={e => setNewDriver({ ...newDriver, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        value={newDriver.email}
                                        onChange={e => setNewDriver({ ...newDriver, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                        <input
                                            required
                                            type="password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                            value={newDriver.password}
                                            onChange={e => setNewDriver({ ...newDriver, password: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                            value={newDriver.phone}
                                            onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                            value={newDriver.vehicleType}
                                            onChange={e => setNewDriver({ ...newDriver, vehicleType: e.target.value })}
                                        >
                                            <option value="moto">Moto</option>
                                            <option value="car">Auto</option>
                                            <option value="bicycle">Bicicleta</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                            value={newDriver.licensePlate}
                                            onChange={e => setNewDriver({ ...newDriver, licensePlate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors mt-2"
                                >
                                    {loading ? 'Creando...' : 'Crear Repartidor'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
