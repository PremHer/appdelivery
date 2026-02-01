import { useEffect, useState } from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    Tag,
    Percent,
    DollarSign,
    Calendar,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Coupon {
    id: string;
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number | null;
    max_discount: number | null;
    max_uses: number | null;
    current_uses: number;
    is_active: boolean;
    valid_until: string | null;
    created_at: string;
}

const emptyCoupon: Partial<Coupon> = {
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: null,
    max_discount: null,
    max_uses: null,
    is_active: true,
    valid_until: null,
};

export default function Coupons() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error loading coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCoupons = coupons.filter(
        (c) =>
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.description.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = () => {
        setEditingCoupon(emptyCoupon);
        setIsCreating(true);
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon({ ...coupon });
        setIsCreating(false);
    };

    const handleSave = async () => {
        if (!editingCoupon || !editingCoupon.code) return;

        setSaving(true);
        try {
            if (isCreating) {
                const { error } = await supabase.from('coupons').insert({
                    code: editingCoupon.code.toUpperCase(),
                    description: editingCoupon.description,
                    discount_type: editingCoupon.discount_type,
                    discount_value: editingCoupon.discount_value,
                    min_order_amount: editingCoupon.min_order_amount || null,
                    max_discount: editingCoupon.max_discount || null,
                    max_uses: editingCoupon.max_uses || null,
                    is_active: editingCoupon.is_active,
                    valid_until: editingCoupon.valid_until || null,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .update({
                        code: editingCoupon.code?.toUpperCase(),
                        description: editingCoupon.description,
                        discount_type: editingCoupon.discount_type,
                        discount_value: editingCoupon.discount_value,
                        min_order_amount: editingCoupon.min_order_amount || null,
                        max_discount: editingCoupon.max_discount || null,
                        max_uses: editingCoupon.max_uses || null,
                        is_active: editingCoupon.is_active,
                        valid_until: editingCoupon.valid_until || null,
                    })
                    .eq('id', editingCoupon.id);
                if (error) throw error;
            }

            loadCoupons();
            setEditingCoupon(null);
        } catch (error) {
            console.error('Error saving coupon:', error);
            alert('Error al guardar cupón');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este cupón?')) return;

        try {
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (error) throw error;
            loadCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
        }
    };

    const toggleStatus = async (coupon: Coupon) => {
        try {
            const { error } = await supabase
                .from('coupons')
                .update({ is_active: !coupon.is_active })
                .eq('id', coupon.id);

            if (error) throw error;
            loadCoupons();
        } catch (error) {
            console.error('Error toggling coupon:', error);
        }
    };

    const isExpired = (validUntil: string | null) => {
        if (!validUntil) return false;
        return new Date(validUntil) < new Date();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Cupones</h1>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                    <Plus size={20} />
                    Nuevo Cupón
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por código o descripción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Cupones</p>
                    <p className="text-2xl font-bold">{coupons.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Activos</p>
                    <p className="text-2xl font-bold text-green-600">
                        {coupons.filter((c) => c.is_active).length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Expirados</p>
                    <p className="text-2xl font-bold text-red-600">
                        {coupons.filter((c) => isExpired(c.valid_until)).length}
                    </p>
                </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-sm text-gray-500">
                                <th className="px-6 py-4">Código</th>
                                <th className="px-6 py-4">Descuento</th>
                                <th className="px-6 py-4">Mín. Pedido</th>
                                <th className="px-6 py-4">Usos</th>
                                <th className="px-6 py-4">Válido hasta</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCoupons.map((coupon) => (
                                <tr key={coupon.id} className="border-t hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Tag className="text-orange-500" size={18} />
                                            <div>
                                                <p className="font-bold text-orange-600">{coupon.code}</p>
                                                <p className="text-xs text-gray-500 max-w-[200px] truncate">
                                                    {coupon.description}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            {coupon.discount_type === 'percentage' ? (
                                                <>
                                                    <Percent className="text-green-500" size={16} />
                                                    <span className="font-bold text-green-600">
                                                        {coupon.discount_value}%
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <DollarSign className="text-green-500" size={16} />
                                                    <span className="font-bold text-green-600">
                                                        S/ {coupon.discount_value}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {coupon.max_discount && (
                                            <p className="text-xs text-gray-500">
                                                Máx: S/ {coupon.max_discount}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {coupon.min_order_amount
                                            ? `S/ ${coupon.min_order_amount}`
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {coupon.current_uses || 0}
                                        {coupon.max_uses && ` / ${coupon.max_uses}`}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {coupon.valid_until ? (
                                            <span
                                                className={
                                                    isExpired(coupon.valid_until)
                                                        ? 'text-red-500'
                                                        : 'text-gray-700'
                                                }
                                            >
                                                {new Date(coupon.valid_until).toLocaleDateString('es-PE')}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">Sin límite</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(coupon)}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${coupon.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}
                                        >
                                            {coupon.is_active ? (
                                                <>
                                                    <ToggleRight size={14} /> Activo
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeft size={14} /> Inactivo
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(coupon)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCoupons.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No hay cupones
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Edit/Create Modal */}
            {editingCoupon && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">
                                {isCreating ? 'Nuevo Cupón' : 'Editar Cupón'}
                            </h3>
                            <button
                                onClick={() => setEditingCoupon(null)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    value={editingCoupon.code || ''}
                                    onChange={(e) =>
                                        setEditingCoupon({
                                            ...editingCoupon,
                                            code: e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                                    placeholder="NUEVO30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <input
                                    type="text"
                                    value={editingCoupon.description || ''}
                                    onChange={(e) =>
                                        setEditingCoupon({
                                            ...editingCoupon,
                                            description: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="30% de descuento para nuevos usuarios"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de descuento
                                    </label>
                                    <select
                                        value={editingCoupon.discount_type || 'percentage'}
                                        onChange={(e) =>
                                            setEditingCoupon({
                                                ...editingCoupon,
                                                discount_type: e.target.value as 'percentage' | 'fixed',
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="percentage">Porcentaje (%)</option>
                                        <option value="fixed">Monto fijo (S/)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valor del descuento
                                    </label>
                                    <input
                                        type="number"
                                        value={editingCoupon.discount_value || ''}
                                        onChange={(e) =>
                                            setEditingCoupon({
                                                ...editingCoupon,
                                                discount_value: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pedido mínimo (S/)
                                    </label>
                                    <input
                                        type="number"
                                        value={editingCoupon.min_order_amount || ''}
                                        onChange={(e) =>
                                            setEditingCoupon({
                                                ...editingCoupon,
                                                min_order_amount: parseFloat(e.target.value) || null,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Sin mínimo"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descuento máximo (S/)
                                    </label>
                                    <input
                                        type="number"
                                        value={editingCoupon.max_discount || ''}
                                        onChange={(e) =>
                                            setEditingCoupon({
                                                ...editingCoupon,
                                                max_discount: parseFloat(e.target.value) || null,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Sin límite"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Usos máximos
                                    </label>
                                    <input
                                        type="number"
                                        value={editingCoupon.max_uses || ''}
                                        onChange={(e) =>
                                            setEditingCoupon({
                                                ...editingCoupon,
                                                max_uses: parseInt(e.target.value) || null,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Sin límite"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Válido hasta
                                    </label>
                                    <input
                                        type="date"
                                        value={
                                            editingCoupon.valid_until
                                                ? editingCoupon.valid_until.split('T')[0]
                                                : ''
                                        }
                                        onChange={(e) =>
                                            setEditingCoupon({
                                                ...editingCoupon,
                                                valid_until: e.target.value || null,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={editingCoupon.is_active}
                                    onChange={(e) =>
                                        setEditingCoupon({
                                            ...editingCoupon,
                                            is_active: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded text-orange-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">
                                    Cupón activo
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSave}
                                disabled={saving || !editingCoupon.code}
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
                                onClick={() => setEditingCoupon(null)}
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
