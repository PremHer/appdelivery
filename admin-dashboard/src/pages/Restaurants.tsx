import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Restaurant {
    id: string;
    name: string;
    description: string;
    address: string;
    phone: string;
    image_url: string;
    latitude: number;
    longitude: number;
    is_active: boolean;
    rating: number;
    store_type: string;
}

export default function Restaurants() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        phone: '',
        image_url: '',
        latitude: -12.0464,
        longitude: -77.0428,
        is_active: true,
        store_type: 'restaurant'
    });

    useEffect(() => {
        loadRestaurants();
    }, []);

    const loadRestaurants = async () => {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading restaurants:', error);
        } else {
            setRestaurants(data || []);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Only send columns that exist in the table
        const restaurantData = {
            name: formData.name,
            description: formData.description,
            address: formData.address,
            phone: formData.phone,
            image_url: formData.image_url,
            latitude: formData.latitude,
            longitude: formData.longitude,
            is_active: formData.is_active,
            store_type: formData.store_type
        };

        if (editingRestaurant) {
            const { error } = await supabase
                .from('restaurants')
                .update(restaurantData)
                .eq('id', editingRestaurant.id);

            if (error) {
                console.error('Error updating:', error);
                alert('Error al actualizar');
                return;
            }
        } else {
            const { error } = await supabase
                .from('restaurants')
                .insert(restaurantData);

            if (error) {
                console.error('Error creating:', error);
                alert('Error al crear tienda: ' + error.message);
                return;
            }
        }

        setShowModal(false);
        setEditingRestaurant(null);
        resetForm();
        loadRestaurants();
    };

    const handleEdit = (restaurant: Restaurant) => {
        setEditingRestaurant(restaurant);
        setFormData({
            name: restaurant.name,
            description: restaurant.description || '',
            address: restaurant.address || '',
            phone: restaurant.phone || '',
            image_url: restaurant.image_url || '',
            latitude: restaurant.latitude || -12.0464,
            longitude: restaurant.longitude || -77.0428,
            is_active: restaurant.is_active,
            store_type: restaurant.store_type || 'restaurant'
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta tienda?')) return;

        const { error } = await supabase
            .from('restaurants')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting:', error);
            alert('Error al eliminar');
        } else {
            loadRestaurants();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            address: '',
            phone: '',
            image_url: '',
            latitude: -12.0464,
            longitude: -77.0428,
            is_active: true,
            store_type: 'restaurant'
        });
    };

    const openNewModal = () => {
        setEditingRestaurant(null);
        resetForm();
        setShowModal(true);
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }));
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('No se pudo obtener la ubicación');
                }
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Tiendas/Restaurantes</h1>
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    <Plus size={18} />
                    <span>Nueva Tienda</span>
                </button>
            </div>

            {/* Restaurants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No hay tiendas registradas. Crea una nueva.
                    </div>
                ) : (
                    restaurants.map((restaurant) => (
                        <div key={restaurant.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="h-40 bg-gray-200 relative">
                                {restaurant.image_url ? (
                                    <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        Sin imagen
                                    </div>
                                )}
                                <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {restaurant.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg">{restaurant.name}</h3>
                                <p className="text-gray-500 text-sm truncate">{restaurant.address}</p>
                                <p className="text-gray-400 text-xs mt-1">
                                    📍 {restaurant.latitude?.toFixed(4)}, {restaurant.longitude?.toFixed(4)}
                                </p>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => handleEdit(restaurant)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                    >
                                        <Edit2 size={16} /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(restaurant.id)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                    >
                                        <Trash2 size={16} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">
                                {editingRestaurant ? 'Editar Tienda' : 'Nueva Tienda'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Ej: Restaurante El Buen Sabor"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tienda</label>
                                <select
                                    value={formData.store_type}
                                    onChange={(e) => setFormData({ ...formData, store_type: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="restaurant">Restaurante</option>
                                    <option value="pharmacy">Farmacia</option>
                                    <option value="supermarket">Supermercado</option>
                                    <option value="pet_shop">Tienda de Mascotas</option>
                                    <option value="liquor">Licorería</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={2}
                                    placeholder="Descripción de la tienda..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Av. Principal 123"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="+51 999 999 999"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                <MapPin size={18} />
                                Usar mi ubicación actual
                            </button>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-orange-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">Tienda activa</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                >
                                    {editingRestaurant ? 'Guardar Cambios' : 'Crear Tienda'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
