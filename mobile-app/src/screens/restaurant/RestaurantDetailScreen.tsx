import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants';
import { supabase } from '../../services/supabase';
import type { Restaurant, Product } from '../../types';
import { useCartStore, useAuthStore } from '../../context/stores';
import favoriteService from '../../services/favorite.service';
import AgeVerificationModal from '../../components/modals/AgeVerificationModal';
import ReviewsModal from '../../components/modals/ReviewsModal';
import { useToast } from '../../components/ui/Toast';

interface RestaurantDetailScreenProps {
    navigation: any;
    route: any;
}

interface Review {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    user: {
        full_name: string;
        avatar_url: string | null;
    };
}

const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({
    navigation,
    route,
}) => {
    const { id } = route.params;
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [ageVerified, setAgeVerified] = useState(false);
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [averageRating, setAverageRating] = useState<{ avg: number; count: number } | null>(null);

    const { user } = useAuthStore();

    const items = useCartStore((state) => state.items);
    const addToCart = useCartStore((state) => state.addItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeItem = useCartStore((state) => state.removeItem);
    const cartRestaurantId = useCartStore((state) => state.restaurantId);
    const cartTotal = useCartStore((state) => state.getSubtotal());
    const cartItemCount = useCartStore((state) => state.getItemCount());

    useEffect(() => {
        fetchRestaurantDetails();
        fetchReviews();
        fetchAverageRating();
        if (user) {
            checkFavoriteStatus();
        }
    }, [id, user]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('id, rating, comment, created_at, user:users(full_name, avatar_url)')
                .eq('restaurant_id', id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setReviews(data as any);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const fetchAverageRating = async () => {
        try {
            const { data, error } = await supabase
                .from('ratings')
                .select('restaurant_rating')
                .eq('restaurant_id', id)
                .not('restaurant_rating', 'is', null);

            if (!error && data && data.length > 0) {
                const avg = data.reduce((sum, r) => sum + r.restaurant_rating, 0) / data.length;
                setAverageRating({
                    avg: Math.round(avg * 10) / 10,
                    count: data.length,
                });
            }
        } catch (error) {
            console.error('Error fetching average rating:', error);
        }
    };

    const checkFavoriteStatus = async () => {
        // ... (keep existing logic)
        if (!user) return;
        try {
            const status = await favoriteService.isFavorite(user.id, id);
            setIsFavorite(status);
        } catch (error) {
            console.error('Error checking favorite:', error);
        }
    };

    const { showToast } = useToast();

    const toggleFavorite = async () => {
        if (!user) {
            showToast({ message: 'Inicia sesión para guardar favoritos', type: 'warning' });
            return;
        }
        try {
            const newStatus = await favoriteService.toggleFavorite(user.id, id);
            setIsFavorite(newStatus);
            if (newStatus) {
                showToast({ message: 'Añadido a favoritos', type: 'success', icon: 'heart' });
            } else {
                showToast({ message: 'Eliminado de favoritos', type: 'info', icon: 'heart-dislike' });
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast({ message: 'No se pudo actualizar', type: 'error' });
        }
    };

    const fetchRestaurantDetails = async () => {
        // ... (keep existing logic)
        try {
            const { data: restaurantData, error: restError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', id)
                .single();

            if (restError) throw restError;
            setRestaurant(restaurantData);

            const { data: productsData, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('restaurant_id', id)
                .eq('is_available', true)
                .order('category_id');

            if (prodError) throw prodError;
            setProducts(productsData || []);

        } catch (error: any) {
            console.error('Error fetching details:', error);
            Alert.alert('Error', 'No se pudo cargar la información del restaurante.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    // Show age verification modal for liquor stores
    useEffect(() => {
        if (restaurant?.requires_age_verification && !ageVerified && !loading) {
            setShowAgeModal(true);
        }
    }, [restaurant, loading]);

    const handleAgeConfirm = () => {
        setAgeVerified(true);
        setShowAgeModal(false);
    };

    const handleAgeCancel = () => {
        setShowAgeModal(false);
        navigation.goBack();
    };

    const getQuantity = (productId: string) => {
        const item = items.find(i => i.product.id === productId);
        return item ? item.quantity : 0;
    };

    const handleIncrement = (product: Product) => {
        // Check if cart has items from another restaurant
        if (cartRestaurantId && cartRestaurantId !== product.restaurant_id) {
            Alert.alert(
                '¿Vaciar carrito?',
                'Tienes productos de otro restaurante. ¿Deseas vaciar el carrito para agregar este nuevo producto?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Vaciar y Agregar', onPress: () => {
                            useCartStore.getState().clearCart();
                            addToCart({ product, quantity: 1 });
                        }
                    }
                ]
            );
            return;
        }
        addToCart({ product, quantity: 1 });
    };

    const handleDecrement = (productId: string) => {
        const currentQty = getQuantity(productId);
        if (currentQty > 1) {
            updateQuantity(productId, currentQty - 1);
        } else {
            removeItem(productId);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!restaurant) return null;

    const renderProductItem = ({ item }: { item: Product }) => {
        const quantity = getQuantity(item.id);

        return (
            <TouchableOpacity
                style={styles.productCard}
                onPress={() => {
                    navigation.navigate('ProductDetail', { product: item });
                }}
                activeOpacity={0.7}
            >
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                    <Text style={styles.productPrice}>S/. {item.price.toFixed(2)}</Text>
                </View>
                {item.image_url && (
                    <Image source={{ uri: item.image_url }} style={styles.productImage} />
                )}

                {quantity > 0 ? (
                    <View style={styles.counterContainer}>
                        <TouchableOpacity
                            style={styles.counterButton}
                            onPress={(e) => { e.stopPropagation(); handleDecrement(item.id); }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="remove" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.counterText}>{quantity}</Text>
                        <TouchableOpacity
                            style={[styles.counterButton, styles.counterButtonAdd]}
                            onPress={(e) => { e.stopPropagation(); handleIncrement(item); }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="add" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleIncrement(item);
                        }}
                    >
                        <Ionicons name="add" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: restaurant.image_url || 'https://via.placeholder.com/800x400'
                        }}
                        style={styles.coverImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.4)']}
                        style={styles.gradient}
                    />

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={toggleFavorite}
                    >
                        <Ionicons
                            name={isFavorite ? "heart" : "heart-outline"}
                            size={24}
                            color={isFavorite ? COLORS.error : COLORS.white}
                        />
                    </TouchableOpacity>

                    {/* Restaurant Info Overlay */}
                    <View style={styles.headerInfo}>
                        <Text style={styles.restaurantName}>{restaurant.name}</Text>
                        <TouchableOpacity
                            style={styles.ratingContainer}
                            onPress={() => setShowReviewsModal(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="star" size={16} color={COLORS.warning} />
                            <Text style={styles.ratingText}>
                                {averageRating ? averageRating.avg : restaurant.rating}
                            </Text>
                            <Text style={styles.reviewCountClickable}>
                                ({averageRating ? averageRating.count : restaurant.total_reviews} reseñas)
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                        <View style={styles.deliveryContainer}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{restaurant.estimated_delivery_time}</Text>
                            </View>
                            <View style={[styles.badge, styles.deliveryBadge]}>
                                <Text style={styles.badgeText}>
                                    Delivery S/. {restaurant.delivery_fee.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Menu Section */}
                <View style={styles.menuContainer}>
                    <Text style={styles.menuTitle}>Menú</Text>
                    <FlatList
                        data={products}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.productsList}
                    />
                </View>

                {/* Reviews Section - Click to open modal */}
                <TouchableOpacity
                    style={styles.reviewsCTA}
                    onPress={() => setShowReviewsModal(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.reviewsCTAContent}>
                        <Ionicons name="star" size={20} color={COLORS.warning} />
                        <View style={styles.reviewsCTAText}>
                            <Text style={styles.reviewsCTATitle}>Ver Reseñas</Text>
                            <Text style={styles.reviewsCTASubtitle}>
                                {reviews.length > 0
                                    ? `${restaurant.total_reviews} opiniones de clientes`
                                    : 'Sé el primero en opinar'
                                }
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                </TouchableOpacity>

                {/* Bottom padding for floating cart */}
                <View style={{ height: 100 }} />
            </ScrollView >

            {/* Floating Cart Bar */}
            {
                cartItemCount > 0 && (
                    <View style={styles.floatingCartContainer}>
                        <TouchableOpacity
                            style={styles.floatingCartButton}
                            onPress={() => navigation.navigate('Cart')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.floatingCartInfo}>
                                <View style={styles.floatingCartBadge}>
                                    <Text style={styles.floatingCartCount}>{cartItemCount}</Text>
                                </View>
                                <Text style={styles.floatingCartText}>Ver pedido</Text>
                            </View>
                            <Text style={styles.floatingCartTotal}>S/. {cartTotal.toFixed(2)}</Text>
                        </TouchableOpacity>
                    </View>
                )
            }

            {/* Age Verification Modal */}
            <AgeVerificationModal
                visible={showAgeModal}
                onConfirm={handleAgeConfirm}
                onCancel={handleAgeCancel}
                storeName={restaurant?.name}
            />

            {/* Reviews Modal */}
            <ReviewsModal
                visible={showReviewsModal}
                onClose={() => setShowReviewsModal(false)}
                reviews={reviews}
                restaurantName={restaurant?.name || ''}
                averageRating={restaurant?.rating || 0}
                totalReviews={restaurant?.total_reviews || 0}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        height: 250,
        width: '100%',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    favoriteButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    headerInfo: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    restaurantName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        color: COLORS.white,
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 14,
    },
    reviewCount: {
        color: COLORS.gray300,
        marginLeft: 4,
        fontSize: 14,
    },
    deliveryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    deliveryBadge: {
        backgroundColor: COLORS.primary,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.black,
    },
    menuContainer: {
        padding: SIZES.lg,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
    },
    menuTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: SIZES.md,
    },
    productsList: {
        gap: SIZES.md,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        ...SHADOWS.small,
        alignItems: 'center',
        minHeight: 100,
    },
    productInfo: {
        flex: 1,
        marginRight: SIZES.md,
    },
    productName: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray800,
        marginBottom: 4,
    },
    productDescription: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
        marginBottom: 8,
    },
    productPrice: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.primary,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: SIZES.radiusSm,
        backgroundColor: COLORS.gray200,
    },
    addButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
        zIndex: 5,
    },
    counterContainer: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: 20,
        padding: 2,
        ...SHADOWS.small,
        zIndex: 5,
    },
    counterButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    counterButtonAdd: {
        backgroundColor: COLORS.primary,
    },
    counterText: {
        marginHorizontal: 8,
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gray800,
        minWidth: 16,
        textAlign: 'center',
    },
    floatingCartContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 100, // Ensure it floats on top
    },
    floatingCartButton: {
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    floatingCartInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIZES.sm,
    },
    floatingCartBadge: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    floatingCartCount: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 12,
    },
    floatingCartText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: SIZES.fontMd,
    },
    floatingCartTotal: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: SIZES.fontMd,
    },
    // Reviews section styles
    reviewsSection: {
        paddingHorizontal: SIZES.md,
        paddingTop: SIZES.lg,
        paddingBottom: SIZES.md,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.md,
    },
    reviewsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.gray800,
    },
    seeAllText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    reviewCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        marginBottom: SIZES.sm,
        ...SHADOWS.small,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray800,
    },
    reviewDate: {
        fontSize: 12,
        color: COLORS.gray400,
        marginTop: 2,
    },
    reviewRating: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 20,
    },
    noReviewsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: SIZES.lg,
    },
    noReviewsText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.gray500,
        marginTop: 12,
    },
    noReviewsSubtext: {
        fontSize: 14,
        color: COLORS.gray400,
        marginTop: 4,
    },
    reviewCountClickable: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    reviewsCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        marginHorizontal: SIZES.md,
        marginTop: SIZES.lg,
        padding: SIZES.md,
        borderRadius: SIZES.radiusMd,
        ...SHADOWS.small,
    },
    reviewsCTAContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reviewsCTAText: {
        gap: 2,
    },
    reviewsCTATitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.gray800,
    },
    reviewsCTASubtitle: {
        fontSize: 12,
        color: COLORS.gray500,
    },
});

export default RestaurantDetailScreen;
