import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants';
import { useCartStore } from '../../context/stores';
import Button from '../../components/ui/Button';

interface CartScreenProps {
    navigation: any;
}

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
    const {
        items,
        restaurantName,
        removeItem,
        updateQuantity,
        getSubtotal,
        clearCart,
    } = useCartStore();

    const subtotal = getSubtotal();
    const deliveryFee = 5.00; // Esto debería venir del restaurante
    const total = subtotal + deliveryFee;

    const handleCheckout = () => {
        navigation.navigate('Checkout');
    };

    const renderCartItem = ({ item }: { item: any }) => (
        <View style={styles.cartItem}>
            {item.product.image_url && (
                <Image source={{ uri: item.product.image_url }} style={styles.itemImage} />
            )}
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                    {item.product.name}
                </Text>
                <Text style={styles.itemPrice}>
                    S/. {item.product.price.toFixed(2)}
                </Text>
            </View>

            <View style={styles.quantityContainer}>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                    <Ionicons name="remove" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                    <Ionicons name="add" size={16} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={24} color={COLORS.gray800} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tu Pedido</Text>
                <TouchableOpacity
                    onPress={() => {
                        Alert.alert(
                            'Vaciar carrito',
                            '¿Estás seguro de que quieres eliminar todos los productos?',
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Sí, vaciar', onPress: clearCart, style: 'destructive' },
                            ]
                        );
                    }}
                >
                    <Text style={styles.clearButton}>Vaciar</Text>
                </TouchableOpacity>
            </View>

            {items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color={COLORS.gray300} />
                    <Text style={styles.emptyText}>Tu carrito está vacío</Text>
                    <Text style={styles.emptySubtext}>
                        ¡Agrega algunos platillos deliciosos!
                    </Text>
                    <Button
                        title="Explorar Restaurantes"
                        onPress={() => navigation.goBack()}
                        style={styles.exploreButton}
                    />
                </View>
            ) : (
                <>
                    <View style={styles.restaurantHeader}>
                        <Text style={styles.restaurantLabel}>Ordenando de:</Text>
                        <Text style={styles.restaurantName}>{restaurantName || 'Restaurante'}</Text>
                    </View>

                    <FlatList
                        data={items}
                        renderItem={renderCartItem}
                        keyExtractor={(item) => item.product.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />

                    <View style={styles.footer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>S/. {subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery</Text>
                            <Text style={styles.summaryValue}>S/. {deliveryFee.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>S/. {total.toFixed(2)}</Text>
                        </View>

                        <Button
                            title="Continuar al Pago"
                            onPress={handleCheckout}
                            style={styles.checkoutButton}
                        />
                    </View>
                </>
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
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    headerTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    closeButton: {
        padding: 4,
    },
    clearButton: {
        fontSize: SIZES.fontMd,
        color: COLORS.error,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SIZES.xl,
    },
    emptyText: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray800,
        marginTop: SIZES.md,
    },
    emptySubtext: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        marginTop: SIZES.xs,
        marginBottom: SIZES.xl,
    },
    exploreButton: {
        width: '100%',
        marginTop: SIZES.lg,
    },
    restaurantHeader: {
        padding: SIZES.lg,
        backgroundColor: COLORS.gray50,
    },
    restaurantLabel: {
        fontSize: SIZES.fontXs,
        color: COLORS.gray500,
        textTransform: 'uppercase',
    },
    restaurantName: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
        marginTop: 4,
    },
    listContainer: {
        padding: SIZES.lg,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: SIZES.md,
        borderRadius: SIZES.radiusMd,
        marginBottom: SIZES.md,
        ...SHADOWS.small,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: SIZES.radiusSm,
        backgroundColor: COLORS.gray200,
    },
    itemInfo: {
        flex: 1,
        marginHorizontal: SIZES.md,
    },
    itemName: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray800,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.primary,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: SIZES.radiusSm,
        padding: 2,
    },
    quantityButton: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusSm - 2,
        ...SHADOWS.small,
    },
    quantityText: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        marginHorizontal: SIZES.sm,
        minWidth: 16,
        textAlign: 'center',
    },
    footer: {
        backgroundColor: COLORS.white,
        padding: SIZES.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        ...SHADOWS.medium,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SIZES.sm,
    },
    summaryLabel: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
    },
    summaryValue: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray900,
    },
    totalRow: {
        marginTop: SIZES.sm,
        paddingTop: SIZES.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        marginBottom: SIZES.lg,
    },
    totalLabel: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    totalValue: {
        fontSize: SIZES.fontXl,
        fontWeight: '800',
        color: COLORS.primary,
    },
    checkoutButton: {
        width: '100%',
    },
});

export default CartScreen;
