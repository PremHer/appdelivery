import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, SIZES } from '../../constants';

interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = 20,
    borderRadius = SIZES.radiusSm,
    style,
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width: width as any,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

// Restaurant Card Skeleton
export const RestaurantCardSkeleton: React.FC = () => (
    <View style={styles.restaurantCard}>
        <SkeletonLoader height={140} borderRadius={SIZES.radiusMd} />
        <View style={styles.restaurantCardContent}>
            <SkeletonLoader width="70%" height={18} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="50%" height={14} style={{ marginBottom: 8 }} />
            <View style={styles.row}>
                <SkeletonLoader width={60} height={14} />
                <SkeletonLoader width={80} height={14} style={{ marginLeft: 12 }} />
            </View>
        </View>
    </View>
);

// Product Card Skeleton
export const ProductCardSkeleton: React.FC = () => (
    <View style={styles.productCard}>
        <View style={styles.productContent}>
            <SkeletonLoader width="80%" height={16} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="100%" height={12} style={{ marginBottom: 4 }} />
            <SkeletonLoader width="60%" height={12} style={{ marginBottom: 8 }} />
            <SkeletonLoader width={60} height={18} />
        </View>
        <SkeletonLoader width={80} height={80} borderRadius={SIZES.radiusSm} />
    </View>
);

// Category Skeleton
export const CategorySkeleton: React.FC = () => (
    <View style={styles.categoryItem}>
        <SkeletonLoader width={50} height={50} borderRadius={25} />
        <SkeletonLoader width={50} height={12} style={{ marginTop: 8 }} />
    </View>
);

// Home Screen Skeleton
export const HomeScreenSkeleton: React.FC = () => (
    <View style={styles.homeContainer}>
        {/* Search bar skeleton */}
        <SkeletonLoader height={48} borderRadius={SIZES.radiusMd} style={{ marginBottom: 16 }} />

        {/* Categories skeleton */}
        <View style={styles.categoriesRow}>
            {[1, 2, 3, 4, 5].map((i) => (
                <CategorySkeleton key={i} />
            ))}
        </View>

        {/* Restaurant cards skeleton */}
        <View style={{ marginTop: 16 }}>
            <SkeletonLoader width={150} height={20} style={{ marginBottom: 12 }} />
            <RestaurantCardSkeleton />
            <View style={{ height: 16 }} />
            <RestaurantCardSkeleton />
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: COLORS.gray200,
    },
    restaurantCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        overflow: 'hidden',
    },
    restaurantCardContent: {
        padding: SIZES.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    productCard: {
        flexDirection: 'row',
        padding: SIZES.md,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusSm,
        marginBottom: SIZES.sm,
    },
    productContent: {
        flex: 1,
        marginRight: SIZES.md,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: SIZES.md,
    },
    categoriesRow: {
        flexDirection: 'row',
        marginBottom: SIZES.md,
    },
    homeContainer: {
        padding: SIZES.lg,
    },
});

export default SkeletonLoader;
