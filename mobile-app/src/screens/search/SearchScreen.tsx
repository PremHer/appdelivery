import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    ScrollView,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, SHADOWS } from '../../constants';
import { supabase } from '../../services/supabase';
import type { Restaurant } from '../../types';

interface SearchScreenProps {
    navigation: any;
}

type SortOption = 'relevance' | 'rating' | 'delivery_time' | 'distance';
type PriceFilter = 'all' | 'low' | 'medium' | 'high';

interface Filters {
    sortBy: SortOption;
    priceRange: PriceFilter;
    minRating: number;
    hasOffers: boolean;
    storeType: string | null;
}

const STORE_TYPES = [
    { id: null, label: 'Todos', icon: '🏪' },
    { id: 'restaurant', label: 'Restaurantes', icon: '🍽️' },
    { id: 'pharmacy', label: 'Farmacias', icon: '💊' },
    { id: 'liquor', label: 'Licorería', icon: '🍷' },
    { id: 'pet_store', label: 'Mascotas', icon: '🐕' },
    { id: 'supermarket', label: 'Mercado', icon: '🛒' },
];

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([
        'Pollo a la brasa',
        'Pizza',
        'Farmacia',
        'Licores',
    ]);

    const [filters, setFilters] = useState<Filters>({
        sortBy: 'relevance',
        priceRange: 'all',
        minRating: 0,
        hasOffers: false,
        storeType: null,
    });

    // Custom debounce using useRef
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            let queryBuilder = supabase
                .from('restaurants')
                .select('*')
                .eq('is_active', true)
                .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

            // Apply store type filter
            if (filters.storeType) {
                queryBuilder = queryBuilder.eq('store_type', filters.storeType);
            }

            // Apply rating filter
            if (filters.minRating > 0) {
                queryBuilder = queryBuilder.gte('rating', filters.minRating);
            }

            // Apply sorting
            switch (filters.sortBy) {
                case 'rating':
                    queryBuilder = queryBuilder.order('rating', { ascending: false });
                    break;
                case 'delivery_time':
                    queryBuilder = queryBuilder.order('delivery_time_min', { ascending: true });
                    break;
                default:
                    queryBuilder = queryBuilder.order('rating', { ascending: false });
            }

            const { data, error } = await queryBuilder.limit(20);

            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, filters]);

    const handleSearchSubmit = () => {
        Keyboard.dismiss();
        if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
            setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)]);
        }
        performSearch(searchQuery);
    };

    const renderStoreItem = ({ item }: { item: Restaurant }) => (
        <TouchableOpacity
            style={styles.storeCard}
            onPress={() => navigation.navigate('RestaurantDetail', { id: item.id })}
        >
            <Image
                source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
                style={styles.storeImage}
            />
            <View style={styles.storeInfo}>
                <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.storeMetaRow}>
                    <Ionicons name="star" size={14} color={COLORS.warning} />
                    <Text style={styles.storeRating}>{item.rating?.toFixed(1) || 'N/A'}</Text>
                    <Text style={styles.storeDot}>•</Text>
                    <Ionicons name="time-outline" size={14} color={COLORS.gray500} />
                    <Text style={styles.storeDelivery}>{(item as any).delivery_time_min || 30}-{(item as any).delivery_time_max || 45} min</Text>
                </View>
                <Text style={styles.storeDescription} numberOfLines={1}>
                    {item.description || item.address}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
        </TouchableOpacity>
    );

    const renderRecentSearch = (search: string, index: number) => (
        <TouchableOpacity
            key={index}
            style={styles.recentItem}
            onPress={() => setSearchQuery(search)}
        >
            <Ionicons name="time-outline" size={18} color={COLORS.gray400} />
            <Text style={styles.recentText}>{search}</Text>
        </TouchableOpacity>
    );

    const renderFilterChip = (
        label: string,
        isActive: boolean,
        onPress: () => void
    ) => (
        <TouchableOpacity
            style={[styles.filterChip, isActive && styles.filterChipActive]}
            onPress={onPress}
        >
            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
                </TouchableOpacity>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.gray400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar tiendas y productos..."
                        placeholderTextColor={COLORS.gray400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Ionicons
                        name="options"
                        size={22}
                        color={showFilters ? COLORS.white : COLORS.gray700}
                    />
                </TouchableOpacity>
            </View>

            {/* Filters Panel */}
            {showFilters && (
                <View style={styles.filtersPanel}>
                    {/* Store Type Filter */}
                    <Text style={styles.filterLabel}>Tipo de tienda</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterScroll}
                    >
                        {STORE_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.id || 'all'}
                                style={[
                                    styles.storeTypeChip,
                                    filters.storeType === type.id && styles.storeTypeChipActive,
                                ]}
                                onPress={() => setFilters({ ...filters, storeType: type.id })}
                            >
                                <Text style={styles.storeTypeIcon}>{type.icon}</Text>
                                <Text style={[
                                    styles.storeTypeText,
                                    filters.storeType === type.id && styles.storeTypeTextActive,
                                ]}>{type.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Rating Filter */}
                    <Text style={styles.filterLabel}>Calificación mínima</Text>
                    <View style={styles.ratingFilter}>
                        {[0, 3, 3.5, 4, 4.5].map((rating) => (
                            <TouchableOpacity
                                key={rating}
                                style={[
                                    styles.ratingChip,
                                    filters.minRating === rating && styles.ratingChipActive,
                                ]}
                                onPress={() => setFilters({ ...filters, minRating: rating })}
                            >
                                {rating > 0 && <Ionicons name="star" size={14} color={filters.minRating === rating ? COLORS.white : COLORS.warning} />}
                                <Text style={[
                                    styles.ratingChipText,
                                    filters.minRating === rating && styles.ratingChipTextActive,
                                ]}>
                                    {rating === 0 ? 'Todos' : `${rating}+`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Sort Options */}
                    <Text style={styles.filterLabel}>Ordenar por</Text>
                    <View style={styles.sortOptions}>
                        {renderFilterChip('Relevancia', filters.sortBy === 'relevance', () => setFilters({ ...filters, sortBy: 'relevance' }))}
                        {renderFilterChip('Mejor rating', filters.sortBy === 'rating', () => setFilters({ ...filters, sortBy: 'rating' }))}
                        {renderFilterChip('Más rápido', filters.sortBy === 'delivery_time', () => setFilters({ ...filters, sortBy: 'delivery_time' }))}
                    </View>
                </View>
            )}

            {/* Results or Recent Searches */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : searchQuery.length === 0 ? (
                <View style={styles.recentContainer}>
                    <Text style={styles.recentTitle}>Búsquedas recientes</Text>
                    {recentSearches.map(renderRecentSearch)}
                </View>
            ) : results.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color={COLORS.gray300} />
                    <Text style={styles.emptyTitle}>No encontramos resultados</Text>
                    <Text style={styles.emptyText}>
                        Intenta con otras palabras o revisa los filtros
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderStoreItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.resultsList}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        gap: SIZES.sm,
    },
    backButton: {
        padding: SIZES.xs,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusFull,
        paddingHorizontal: SIZES.md,
        height: 44,
        ...SHADOWS.small,
    },
    searchInput: {
        flex: 1,
        marginLeft: SIZES.sm,
        fontSize: SIZES.fontMd,
        color: COLORS.gray800,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
    },
    filtersPanel: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    filterLabel: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
        color: COLORS.gray700,
        marginBottom: SIZES.xs,
        marginTop: SIZES.sm,
    },
    filterScroll: {
        marginBottom: SIZES.xs,
    },
    storeTypeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusFull,
        marginRight: SIZES.sm,
        gap: SIZES.xs,
    },
    storeTypeChipActive: {
        backgroundColor: COLORS.primary + '20',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    storeTypeIcon: {
        fontSize: 16,
    },
    storeTypeText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
    },
    storeTypeTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    ratingFilter: {
        flexDirection: 'row',
        gap: SIZES.sm,
    },
    ratingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusFull,
        gap: 4,
    },
    ratingChipActive: {
        backgroundColor: COLORS.primary,
    },
    ratingChipText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
    },
    ratingChipTextActive: {
        color: COLORS.white,
        fontWeight: '600',
    },
    sortOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SIZES.sm,
    },
    filterChip: {
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusFull,
        backgroundColor: COLORS.gray100,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
    },
    filterChipTextActive: {
        color: COLORS.white,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentContainer: {
        padding: SIZES.lg,
    },
    recentTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray700,
        marginBottom: SIZES.md,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SIZES.sm,
        gap: SIZES.sm,
    },
    recentText: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray600,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.xl,
    },
    emptyTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '600',
        color: COLORS.gray700,
        marginTop: SIZES.md,
    },
    emptyText: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        textAlign: 'center',
        marginTop: SIZES.xs,
    },
    resultsList: {
        padding: SIZES.md,
    },
    storeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        marginBottom: SIZES.sm,
        ...SHADOWS.small,
    },
    storeImage: {
        width: 70,
        height: 70,
        borderRadius: SIZES.radiusMd,
    },
    storeInfo: {
        flex: 1,
        marginLeft: SIZES.md,
    },
    storeName: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    storeMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    storeRating: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray700,
        fontWeight: '600',
    },
    storeDot: {
        color: COLORS.gray400,
    },
    storeDelivery: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    storeDescription: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
        marginTop: 4,
    },
});

export default SearchScreen;
