import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, SHADOWS } from '../../constants';
import { useAuthStore } from '../../context/stores';
import favoriteService from '../../services/favorite.service';
import type { Restaurant } from '../../types';
import Button from '../../components/ui/Button';

interface FavoritesScreenProps {
    navigation: any;
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
    const { user } = useAuthStore();
    const [favorites, setFavorites] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFavorites = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await favoriteService.getFavorites(user.id);
            setFavorites(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [user])
    );

    const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RestaurantDetail', { id: item.id })}
        >
            <Image
                source={{ uri: item.image_url || 'https://via.placeholder.com/300x150' }}
                style={styles.coverImage}
            />
            <View style={styles.cardContent}>
                <View style={styles.row}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.rating}>
                        <Ionicons name="star" size={14} color={COLORS.warning} />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                </View>
                <Text style={styles.info}>
                    {item.estimated_delivery_time} • Delivery S/. {item.delivery_fee.toFixed(2)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-outline" size={80} color={COLORS.gray400} />
                    <Text style={styles.emptyTitle}>Inicia Sesión</Text>
                    <Text style={styles.emptyText}>
                        Para ver tus favoritos, necesitas ingresar a tu cuenta.
                    </Text>
                    <Button
                        title="Iniciar Sesión"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.button}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Favoritos</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-dislike-outline" size={80} color={COLORS.gray300} />
                    <Text style={styles.emptyTitle}>Sin favoritos</Text>
                    <Text style={styles.emptyText}>
                        Guarda tus restaurantes preferidos para encontrarlos rápido.
                    </Text>
                    <Button
                        title="Explorar Restaurantes"
                        onPress={() => navigation.navigate('Home')}
                        style={styles.button}
                    />
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderRestaurantItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    headerTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    listContent: {
        padding: SIZES.lg,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        marginBottom: SIZES.md,
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    coverImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: SIZES.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
        flex: 1,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    ratingText: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
        marginLeft: 2,
        color: COLORS.gray900,
    },
    info: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.xl,
    },
    emptyTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
        marginTop: SIZES.lg,
        marginBottom: SIZES.xs,
    },
    emptyText: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        textAlign: 'center',
        marginBottom: SIZES.xl,
    },
    button: {
        minWidth: 200,
    },
});

export default FavoritesScreen;
