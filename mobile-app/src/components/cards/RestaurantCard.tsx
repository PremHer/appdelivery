import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, APP_CONFIG } from '../../constants';
import type { Restaurant } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - SIZES.lg * 2;

interface RestaurantCardProps {
    restaurant: Restaurant;
    onPress: () => void;
    onFavoritePress?: () => void;
    isFavorite?: boolean;
    variant?: 'horizontal' | 'vertical';
    quantity?: number;
    onIncrement?: () => void;
    onDecrement?: () => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
    restaurant,
    onPress,
    onFavoritePress,
    isFavorite = false,
    variant = 'vertical',
    quantity = 0,
    onIncrement,
    onDecrement,
}) => {
    const formatPrice = (price: number) => {
        return `${APP_CONFIG.currency} ${price.toFixed(2)}`;
    };

    if (variant === 'horizontal') {
        // ... (keep horizontal logic mostly same, or add small counter badge)
        return (
            <TouchableOpacity
                style={styles.horizontalCard}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <Image
                    source={{ uri: restaurant.image_url || 'https://via.placeholder.com/120' }}
                    style={styles.horizontalImage}
                />
                <View style={styles.horizontalContent}>
                    <View style={styles.horizontalHeader}>
                        <Text style={styles.name} numberOfLines={1}>
                            {restaurant.name}
                        </Text>
                        {/* ... favorite ... */}
                    </View>
                    {/* ... description ... */}
                    <View style={styles.meta}>
                        {/* ... rating ... */}
                        {quantity > 0 && (
                            <View style={styles.quantityBadge}>
                                <Text style={styles.quantityText}>{quantity}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Vertical Card Logic (Used in Listings commonly)
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: restaurant.image_url || 'https://via.placeholder.com/400x200' }}
                    style={styles.image}
                />

                {/* Overlay badges */}
                <View style={styles.badgeContainer}>
                    {restaurant.delivery_fee === 0 && (
                        <View style={[styles.badge, styles.freeBadge]}>
                            <Text style={styles.badgeText}>Envío Gratis</Text>
                        </View>
                    )}
                </View>

                {/* Favorite button */}
                {onFavoritePress && (
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={onFavoritePress}
                    >
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={22}
                            color={isFavorite ? COLORS.error : COLORS.white}
                        />
                    </TouchableOpacity>
                )}

                {/* Status indicator */}
                {!restaurant.is_open && (
                    <View style={styles.closedOverlay}>
                        <Text style={styles.closedText}>Cerrado</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={1}>
                        {restaurant.name}
                    </Text>
                    <View style={styles.rating}>
                        <Ionicons name="star" size={14} color={COLORS.warning} />
                        <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    </View>
                </View>

                <Text style={styles.description} numberOfLines={1}>
                    {restaurant.categories ? restaurant.categories.join(' • ') : ''}
                </Text>

                <View style={styles.footer}>
                    {/* ... details ... */}
                    {(onIncrement && onDecrement) ? (
                        <View style={styles.actionContainer}>
                            {quantity > 0 ? (
                                <View style={styles.counterContainer}>
                                    <TouchableOpacity
                                        style={styles.counterButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onDecrement();
                                        }}
                                    >
                                        <Ionicons name="remove" size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.counterText}>{quantity}</Text>
                                    <TouchableOpacity
                                        style={styles.counterButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            onIncrement();
                                        }}
                                    >
                                        <Ionicons name="add" size={20} color={COLORS.white} style={{ backgroundColor: COLORS.primary, borderRadius: 10 }} />
                                    </TouchableOpacity>
                                    {/* Use slightly different style for add/remove */}
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onIncrement();
                                    }}
                                >
                                    <Ionicons name="add" size={24} color={COLORS.white} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.infoItem}>
                            {/* Fallback layout */}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        overflow: 'hidden',
        marginBottom: SIZES.md,
        ...SHADOWS.medium,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 160,
        backgroundColor: COLORS.gray200,
    },
    badgeContainer: {
        position: 'absolute',
        top: SIZES.sm,
        left: SIZES.sm,
        flexDirection: 'row',
        gap: SIZES.xs,
    },
    badge: {
        paddingHorizontal: SIZES.sm,
        paddingVertical: SIZES.xs,
        borderRadius: SIZES.radiusSm,
    },
    freeBadge: {
        backgroundColor: COLORS.accent,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: SIZES.fontXs,
        fontWeight: '600',
    },
    favoriteButton: {
        position: 'absolute',
        top: SIZES.sm,
        right: SIZES.sm,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: SIZES.radiusFull,
        padding: SIZES.sm,
    },
    closedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closedText: {
        color: COLORS.white,
        fontSize: SIZES.fontXl,
        fontWeight: '700',
    },
    content: {
        padding: SIZES.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.xs,
    },
    name: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
        flex: 1,
        marginRight: SIZES.sm,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray800,
    },
    reviews: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    description: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        marginBottom: SIZES.sm,
    },
    footer: {
        flexDirection: 'row',
        gap: SIZES.md,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SIZES.sm,
    },
    deliveryTime: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    // Horizontal variant
    horizontalCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        overflow: 'hidden',
        marginBottom: SIZES.sm,
        ...SHADOWS.small,
    },
    horizontalImage: {
        width: 100,
        height: 100,
        backgroundColor: COLORS.gray200,
    },
    horizontalContent: {
        flex: 1,
        padding: SIZES.sm,
        justifyContent: 'space-between',
    },
    horizontalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    quantityBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    quantityText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: 20,
        padding: 2,
    },
    counterButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    counterText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.gray900,
        marginHorizontal: 12,
        minWidth: 20,
        textAlign: 'center',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
});

export default RestaurantCard;
