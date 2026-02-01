import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import RestaurantCard from '../../components/cards/RestaurantCard';
import { COLORS, SIZES, SHADOWS, CATEGORY_ICONS } from '../../constants';
import { useAuthStore, useLocationStore, useCartStore } from '../../context/stores';
import { supabase } from '../../services/supabase';
import favoriteService from '../../services/favorite.service';
import { useToast } from '../../components/ui/Toast';
import type { Restaurant, Category, StoreType } from '../../types';

interface HomeScreenProps {
    navigation: any;
}

// Store type tabs configuration
const storeTypeTabs: { id: StoreType | 'all'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'all', label: 'Todo', icon: 'apps' },
    { id: 'restaurant', label: 'Restaurantes', icon: 'restaurant' },
    { id: 'pharmacy', label: 'Farmacias', icon: 'medical' },
    { id: 'liquor_store', label: 'Licorería', icon: 'wine' },
    { id: 'pet_store', label: 'Mascotas', icon: 'paw' },
    { id: 'grocery', label: 'Mercado', icon: 'cart' },
    { id: 'hardware', label: 'Ferretería', icon: 'hammer' },
    { id: 'convenience', label: 'Tiendas', icon: 'storefront' },
];

// Categories per store type
const categoriesByStoreType: Record<StoreType | 'all', { name: string; icon: string }[]> = {
    all: [
        { name: 'Comida', icon: '🍔' },
        { name: 'Farmacias', icon: '💊' },
        { name: 'Licores', icon: '🍷' },
        { name: 'Mascotas', icon: '🐕' },
        { name: 'Mercado', icon: '🛒' },
    ],
    restaurant: [
        { name: 'Pollo', icon: '🍗' },
        { name: 'Desayunos', icon: '🥞' },
        { name: 'Helados', icon: '🍦' },
        { name: 'Hamburguesas', icon: '🍔' },
        { name: 'Pizza', icon: '🍕' },
        { name: 'Sushi', icon: '🍣' },
        { name: 'Mexicana', icon: '🌮' },
        { name: 'Postres', icon: '🍰' },
    ],
    pharmacy: [
        { name: 'Medicinas', icon: '💊' },
        { name: 'Vitaminas', icon: '💉' },
        { name: 'Cuidado Personal', icon: '🧴' },
        { name: 'Bebés', icon: '👶' },
        { name: 'Primeros Auxilios', icon: '🩹' },
    ],
    liquor_store: [
        { name: 'Vinos', icon: '🍷' },
        { name: 'Cervezas', icon: '🍺' },
        { name: 'Whisky', icon: '🥃' },
        { name: 'Pisco', icon: '🍸' },
        { name: 'Ron', icon: '🥃' },
    ],
    pet_store: [
        { name: 'Alimento', icon: '🦴' },
        { name: 'Juguetes', icon: '🎾' },
        { name: 'Higiene', icon: '🧼' },
        { name: 'Accesorios', icon: '🎀' },
        { name: 'Salud', icon: '💊' },
    ],
    grocery: [
        { name: 'Frutas', icon: '🍎' },
        { name: 'Verduras', icon: '🥦' },
        { name: 'Carnes', icon: '🥩' },
        { name: 'Lácteos', icon: '🥛' },
        { name: 'Panadería', icon: '🍞' },
    ],
    hardware: [
        { name: 'Herramientas', icon: '🔧' },
        { name: 'Pintura', icon: '🎨' },
        { name: 'Electricidad', icon: '💡' },
        { name: 'Plomería', icon: '🔩' },
        { name: 'Jardinería', icon: '🌱' },
    ],
    convenience: [
        { name: 'Snacks', icon: '🍿' },
        { name: 'Bebidas', icon: '🥤' },
        { name: 'Dulces', icon: '🍬' },
        { name: 'Cigarros', icon: '🚬' },
        { name: 'Hielo', icon: '🧊' },
    ],
    bakery: [
        { name: 'Pan', icon: '🍞' },
        { name: 'Pasteles', icon: '🎂' },
        { name: 'Galletas', icon: '🍪' },
        { name: 'Empanadas', icon: '🥟' },
    ],
    other: [
        { name: 'Varios', icon: '📦' },
    ],
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedStoreType, setSelectedStoreType] = useState<StoreType | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Estados para datos
    const [categories, setCategories] = useState<Category[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    const user = useAuthStore((state) => state.user);
    const currentAddress = useLocationStore((state) => state.currentAddress);
    const cartItemCount = useCartStore((state) => state.getItemCount());

    // Cargar favoritos
    const loadFavorites = useCallback(async () => {
        if (!user) {
            setFavoriteIds([]);
            return;
        }
        try {
            const data = await favoriteService.getFavorites(user.id);
            setFavoriteIds(data.map(r => r.id));
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }, [user]);

    // Recargar favoritos al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [loadFavorites])
    );

    const { showToast } = useToast();

    const handleToggleFavorite = async (restaurantId: string) => {
        if (!user) {
            showToast({ message: 'Inicia sesión para guardar favoritos', type: 'warning' });
            return;
        }

        try {
            // Optimistic update
            const isFav = favoriteIds.includes(restaurantId);
            let newIds;
            if (isFav) {
                newIds = favoriteIds.filter(id => id !== restaurantId);
            } else {
                newIds = [...favoriteIds, restaurantId];
            }
            setFavoriteIds(newIds);

            // Call API
            const newStatus = await favoriteService.toggleFavorite(user.id, restaurantId);

            // Revert if API response mismatch (though we trust the optimistic update mostly)
            if (newStatus && !newIds.includes(restaurantId)) {
                setFavoriteIds([...favoriteIds, restaurantId]);
            } else if (!newStatus && newIds.includes(restaurantId)) {
                setFavoriteIds(favoriteIds.filter(id => id !== restaurantId));
            }

            if (newStatus) {
                showToast({ message: 'Añadido a favoritos', type: 'success', icon: 'heart' });
            } else {
                showToast({ message: 'Eliminado de favoritos', type: 'info', icon: 'heart-dislike' });
            }

        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast({ message: 'No se pudo actualizar favoritos', type: 'error' });
            loadFavorites(); // Revert to server state
        }
    };

    // Cargar datos iniciales
    const fetchData = useCallback(async () => {
        try {
            // Cargar categorías
            const { data: categoriesData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (catError) throw catError;
            setCategories(categoriesData || []);

            // Cargar restaurantes (traeremos todos por ahora, luego se puede paginar)
            const { data: restaurantsData, error: restError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('is_active', true)
                .order('rating', { ascending: false }); // Mostrar mejores calificados primero

            if (restError) throw restError;
            setRestaurants(restaurantsData || []);
            setFilteredRestaurants(restaurantsData || []);

        } catch (error: any) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos. Verifica tu conexión.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        loadFavorites();
    }, [fetchData, loadFavorites]);

    // Filtrar restaurantes cuando cambia la búsqueda, categoría o tipo de tienda
    useEffect(() => {
        let result = restaurants;

        // Filter by store type
        if (selectedStoreType !== 'all') {
            result = result.filter((r) => r.store_type === selectedStoreType);
        }

        if (selectedCategory) {
            result = result.filter((r) =>
                r.categories && r.categories.some((c: string) =>
                    c.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                    c.toLowerCase() === selectedCategory.toLowerCase()
                )
            );
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((r) =>
                r.name.toLowerCase().includes(query) ||
                (r.description && r.description.toLowerCase().includes(query))
            );
        }

        setFilteredRestaurants(result);
    }, [searchQuery, selectedCategory, selectedStoreType, restaurants]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
        loadFavorites();
    };

    const renderCategoryItem = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() =>
                setSelectedCategory(selectedCategory === item.slug ? null : item.slug)
            }
        >
            <View
                style={[
                    styles.categoryIconContainer,
                    selectedCategory === item.slug && styles.categoryIconContainerActive,
                ]}
            >
                <Text style={styles.categoryIcon}>
                    {CATEGORY_ICONS[item.slug] || item.icon || '🍽️'}
                </Text>
            </View>
            <Text
                style={[
                    styles.categoryName,
                    selectedCategory === item.slug && styles.categoryNameActive,
                ]}
                numberOfLines={1}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    // Get dynamic categories based on selected store type
    const dynamicCategories = categoriesByStoreType[selectedStoreType] || categoriesByStoreType.all;

    const renderDynamicCategory = (cat: { name: string; icon: string }, index: number) => (
        <TouchableOpacity
            key={index}
            style={styles.categoryItem}
            onPress={() =>
                setSelectedCategory(selectedCategory === cat.name ? null : cat.name)
            }
        >
            <View
                style={[
                    styles.categoryIconContainer,
                    selectedCategory === cat.name && styles.categoryIconContainerActive,
                ]}
            >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
            </View>
            <Text
                style={[
                    styles.categoryName,
                    selectedCategory === cat.name && styles.categoryNameActive,
                ]}
                numberOfLines={1}
            >
                {cat.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.locationButton}
                        onPress={() => navigation.navigate('SelectAddress')}
                    >
                        <Ionicons name="location" size={20} color={COLORS.primary} />
                        <View style={styles.locationText}>
                            <Text style={styles.deliverTo}>Entregar en</Text>
                            <View style={styles.addressRow}>
                                <Text style={styles.address} numberOfLines={1}>
                                    {currentAddress?.label || 'Seleccionar dirección'}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color={COLORS.gray700} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <Ionicons name="cart-outline" size={24} color={COLORS.gray700} />
                        {cartItemCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* Greeting */}
                <View style={styles.greeting}>
                    <Text style={styles.greetingText}>
                        Hola, {user?.full_name?.split(' ')[0] || 'Invitado'} 👋
                    </Text>
                    <Text style={styles.greetingSubtext}>¿Qué te gustaría ordenar hoy?</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={COLORS.gray400} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar restaurantes o tiendas..."
                            placeholderTextColor={COLORS.gray400}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Store Type Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.storeTypeTabs}
                    contentContainerStyle={styles.storeTypeTabsContent}
                >
                    {storeTypeTabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.storeTypeTab,
                                selectedStoreType === tab.id && styles.storeTypeTabActive
                            ]}
                            onPress={() => {
                                setSelectedStoreType(tab.id);
                                setSelectedCategory(null); // Reset category when changing store type
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={18}
                                color={selectedStoreType === tab.id ? COLORS.white : COLORS.gray600}
                            />
                            <Text
                                style={[
                                    styles.storeTypeTabText,
                                    selectedStoreType === tab.id && styles.storeTypeTabTextActive
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Promo Banner */}
                <TouchableOpacity style={styles.promoBanner} activeOpacity={0.9}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.promoGradient}
                    >
                        <View style={styles.promoContent}>
                            <Text style={styles.promoTitle}>30% OFF</Text>
                            <Text style={styles.promoSubtitle}>
                                En tu primer pedido
                            </Text>
                            <View style={styles.promoButton}>
                                <Text style={styles.promoButtonText}>Usar: NUEVO30</Text>
                            </View>
                        </View>
                        <Text style={styles.promoEmoji}>🍔</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Categorías</Text>
                    {selectedCategory && (
                        <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                            <Text style={{ color: COLORS.primary, fontSize: 14 }}>Limpiar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                >
                    {dynamicCategories.map((cat, index) => renderDynamicCategory(cat, index))}
                </ScrollView>

                {/* Restaurants/Stores List */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory
                            ? selectedCategory
                            : selectedStoreType === 'all'
                                ? 'Populares cerca de ti'
                                : storeTypeTabs.find(t => t.id === selectedStoreType)?.label || 'Tiendas'}
                    </Text>
                </View>
                {loading && !refreshing && restaurants.length === 0 ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
                ) : (
                    <View style={styles.restaurantsList}>
                        {filteredRestaurants.length > 0 ? (
                            filteredRestaurants.map((restaurant) => (
                                <RestaurantCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    isFavorite={favoriteIds.includes(restaurant.id)}
                                    onPress={() =>
                                        navigation.navigate('RestaurantDetail', { id: restaurant.id })
                                    }
                                    onFavoritePress={() => handleToggleFavorite(restaurant.id)}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="storefront-outline" size={48} color={COLORS.gray300} />
                                <Text style={styles.emptyText}>No se encontraron tiendas</Text>
                            </View>
                        )}
                    </View>
                )
                }

                <View style={styles.bottomSpacing} />
            </ScrollView >
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.sm,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    headerLeft: {
        flex: 1,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        marginLeft: SIZES.sm,
    },
    deliverTo: {
        fontSize: SIZES.fontXs,
        color: COLORS.gray500,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    address: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray800,
        maxWidth: 180,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIZES.xs,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.white,
    },
    greeting: {
        paddingHorizontal: SIZES.lg,
        paddingTop: SIZES.lg,
        paddingBottom: SIZES.sm,
    },
    greetingText: {
        fontSize: SIZES.fontXxl,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    greetingSubtext: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        marginTop: SIZES.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.lg,
        paddingBottom: SIZES.md,
        gap: SIZES.sm,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        ...SHADOWS.small,
    },
    searchInput: {
        flex: 1,
        marginLeft: SIZES.sm,
        fontSize: SIZES.fontMd,
        color: COLORS.gray800,
    },
    storeTypeTabs: {
        marginBottom: SIZES.md,
    },
    storeTypeTabsContent: {
        paddingHorizontal: SIZES.lg,
        gap: SIZES.sm,
    },
    storeTypeTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusFull,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        gap: 6,
    },
    storeTypeTabActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    storeTypeTabText: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
        color: COLORS.gray600,
    },
    storeTypeTabTextActive: {
        color: COLORS.white,
    },
    promoBanner: {
        marginHorizontal: SIZES.lg,
        marginBottom: SIZES.lg,
        borderRadius: SIZES.radiusLg,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    promoGradient: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.lg,
    },
    promoContent: {
        flex: 1,
    },
    promoTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
    },
    promoSubtitle: {
        fontSize: SIZES.fontMd,
        color: 'rgba(255,255,255,0.9)',
        marginTop: SIZES.xs,
    },
    promoButton: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusSm,
        alignSelf: 'flex-start',
        marginTop: SIZES.sm,
    },
    promoButtonText: {
        fontSize: SIZES.fontSm,
        fontWeight: '700',
        color: COLORS.primary,
    },
    promoEmoji: {
        fontSize: 60,
        marginLeft: SIZES.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.lg,
        marginBottom: SIZES.md,
    },
    sectionTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    categoriesList: {
        paddingHorizontal: SIZES.lg,
        paddingBottom: SIZES.lg,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: SIZES.md,
        width: 72,
    },
    categoryIconContainer: {
        width: 64,
        height: 64,
        borderRadius: SIZES.radiusMd,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.xs,
        ...SHADOWS.small,
    },
    categoryIconContainerActive: {
        backgroundColor: COLORS.primary,
    },
    categoryIcon: {
        fontSize: 28,
    },
    categoryName: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
        textAlign: 'center',
    },
    categoryNameActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    restaurantsList: {
        paddingHorizontal: SIZES.lg,
    },
    loader: {
        marginVertical: SIZES.xxl,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SIZES.xxl,
    },
    emptyText: {
        marginTop: SIZES.md,
        color: COLORS.gray500,
        fontSize: SIZES.fontMd,
    },
    bottomSpacing: {
        height: 100,
    },
});

export default HomeScreen;
