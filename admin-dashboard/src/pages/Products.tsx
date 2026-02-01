import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    is_available: boolean;
    restaurant_id: string;
    category_id: string;
    restaurant?: { name: string };
}

interface Restaurant {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [filterRestaurant, setFilterRestaurant] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        image_url: '',
        is_available: true,
        restaurant_id: '',
        category_id: ''
    });

    useEffect(() => {
        loadProducts();
        loadRestaurants();
        loadCategories();
    }, [filterRestaurant]);

    const loadProducts = async () => {
        let query = supabase
            .from('products')
            .select('*, restaurant:restaurants(name)')
            .order('created_at', { ascending: false });

        if (filterRestaurant) {
            query = query.eq('restaurant_id', filterRestaurant);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading products:', error);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    };

    const loadRestaurants = async () => {
        const { data } = await supabase
            .from('restaurants')
            .select('id, name')
            .eq('is_active', true)
            .order('name');
        setRestaurants(data || []);
    };

    const loadCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('id, name')
            .order('name');
        setCategories(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.restaurant_id) {
            alert('Selecciona una tienda');
            return;
        }

        const productData = {
            ...formData,
            preparation_time: 15
        };

        if (editingProduct) {
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', editingProduct.id);

            if (error) {
                console.error('Error updating:', error);
                alert('Error al actualizar');
                return;
            }
        } else {
            const { error } = await supabase
                .from('products')
                .insert(productData);

            if (error) {
                console.error('Error creating:', error);
                alert('Error al crear producto');
                return;
            }
        }

        setShowModal(false);
        setEditingProduct(null);
        resetForm();
        loadProducts();
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            image_url: product.image_url || '',
            is_available: product.is_available,
            restaurant_id: product.restaurant_id,
            category_id: product.category_id || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting:', error);
            alert('Error al eliminar');
        } else {
            loadProducts();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            image_url: '',
            is_available: true,
            restaurant_id: filterRestaurant || '',
            category_id: ''
        });
    };

    const openNewModal = () => {
        setEditingProduct(null);
        resetForm();
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Productos</h1>
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    <Plus size={18} />
                    <span>Nuevo Producto</span>
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <Package size={20} className="text-gray-400" />
                    <select
                        value={filterRestaurant}
                        onChange={(e) => setFilterRestaurant(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">Todas las tiendas</option>
                        {restaurants.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No hay productos. {filterRestaurant ? 'Selecciona otra tienda o' : ''} Crea uno nuevo.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-sm text-gray-500">
                                <th className="px-6 py-4">Imagen</th>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Tienda</th>
                                <th className="px-6 py-4">Precio</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-t hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                    Sin img
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium">{product.name}</p>
                                            <p className="text-gray-500 text-sm truncate max-w-[200px]">{product.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {(product.restaurant as any)?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        S/ {product.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {product.is_available ? 'Disponible' : 'No disponible'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tienda *</label>
                                <select
                                    required
                                    value={formData.restaurant_id}
                                    onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="">Selecciona una tienda</option>
                                    {restaurants.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Ej: Hamburguesa Clásica"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={2}
                                    placeholder="Descripción del producto..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="">Sin categoría</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="https://ejemplo.com/producto.jpg"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_available"
                                    checked={formData.is_available}
                                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                    className="w-4 h-4 text-orange-500"
                                />
                                <label htmlFor="is_available" className="text-sm text-gray-700">Producto disponible</label>
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
                                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
