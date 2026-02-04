import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS, SIZES, SHADOWS } from '../../constants';
import { useCartStore, useAuthStore, useLocationStore } from '../../context/stores';
import orderService from '../../services/order.service';
import addressService from '../../services/address.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TipSelector from '../../components/ui/TipSelector';
import PaymentMethodSelector from '../../components/ui/PaymentMethodSelector';
import { supabase } from '../../services/supabase';
import ScheduledDeliveryModal from '../../components/modals/ScheduledDeliveryModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CheckoutScreenProps {
    navigation: any;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
    const { items, getSubtotal, clearCart, restaurantId } = useCartStore();
    const { user } = useAuthStore();
    const { currentAddress, setCurrentAddress } = useLocationStore();

    // Local state back-up for manual entry if needed (though we prefer store)
    const [addressText, setAddressText] = useState('');
    const [locationCoords, setLocationCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<import('../../types').PaymentMethod>('cash');
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [note, setNote] = useState('');

    // Promo code state
    const [promoCode, setPromoCode] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<{
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        maxDiscount?: number;
    } | null>(null);

    // Scheduled delivery state
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduledTime, setScheduledTime] = useState<Date | null>(null);

    // Delivery instructions state
    const [deliveryInstructions, setDeliveryInstructions] = useState<string[]>([]);
    const [deliveryNote, setDeliveryNote] = useState('');

    // Tip state
    const [selectedTip, setSelectedTip] = useState(0);

    const subtotal = getSubtotal();
    const deliveryFee = 5.00;

    // Calculate discount
    let discount = 0;
    if (appliedPromo) {
        if (appliedPromo.discountType === 'percentage') {
            discount = (subtotal * appliedPromo.discountValue) / 100;
            if (appliedPromo.maxDiscount && discount > appliedPromo.maxDiscount) {
                discount = appliedPromo.maxDiscount;
            }
        } else {
            discount = appliedPromo.discountValue;
        }
    }

    const total = subtotal + deliveryFee - discount + selectedTip;

    // Load default address if none selected
    useFocusEffect(
        useCallback(() => {
            const checkDefaultAddress = async () => {
                if (!user) return;

                // If we already have a selected address in store, use it
                if (currentAddress) {
                    setAddressText(currentAddress.address);
                    setLocationCoords({
                        lat: currentAddress.latitude,
                        lng: currentAddress.longitude
                    });
                    return;
                }

                // Otherwise try to find one
                try {
                    const addresses = await addressService.getAddresses(user.id);
                    if (addresses && addresses.length > 0) {
                        const defaultAddr = addresses.find(a => a.is_default);
                        if (defaultAddr) {
                            setCurrentAddress(defaultAddr);
                            setAddressText(defaultAddr.address);
                            setLocationCoords({
                                lat: defaultAddr.latitude,
                                longitude: defaultAddr.longitude
                            } as any);
                        } else {
                            // If no default, maybe just pick the first one? Or let user choose.
                            // For now, let's just leave it empty to force user to choose/add.
                        }
                    }
                } catch (error) {
                    console.error('Error fetching addresses:', error);
                }
            };

            checkDefaultAddress();
        }, [user, currentAddress])
    );

    const handleGetLocation = async () => {
        setLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Permite el acceso a la ubicación para detectar tu dirección.');
                setLocating(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setLocationCoords({
                lat: location.coords.latitude,
                lng: location.coords.longitude
            });

            // Reverse Geocoding
            const addressResponse = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (addressResponse && addressResponse.length > 0) {
                const addr = addressResponse[0];
                const fullAddress = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}`.trim();
                setAddressText(fullAddress || 'Ubicación detectada');
                // Note: We are not setting currentAddress in store here, treating this as "manual/guest" override
                // unless we want to force saving it.
                setCurrentAddress(null); // Clear store selection to indicate manual/GPS
            } else {
                setAddressText('Ubicación detectada (Coordenadas guardadas)');
                setCurrentAddress(null);
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo obtener la ubicación.');
        } finally {
            setLocating(false);
        }
    };

    const handleChangeAddress = () => {
        navigation.navigate('AddressList', { returnTo: 'Checkout' });
    };

    const applyPromoCode = async () => {
        if (!promoCode.trim()) {
            Alert.alert('Error', 'Ingresa un código promocional');
            return;
        }

        setPromoLoading(true);

        try {
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', promoCode.toUpperCase().trim())
                .eq('is_active', true)
                .single();

            if (error || !coupon) {
                Alert.alert('Código inválido', 'El código promocional no existe o ha expirado');
                return;
            }

            // Check expiration
            if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
                Alert.alert('Código expirado', 'Este código promocional ya no es válido');
                return;
            }

            // Check minimum order amount
            if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
                Alert.alert(
                    'Monto mínimo',
                    `Este código requiere un pedido mínimo de S/ ${coupon.min_order_amount.toFixed(2)}`
                );
                return;
            }

            // Check usage limit
            if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
                Alert.alert('Límite alcanzado', 'Este código ha alcanzado su límite de usos');
                return;
            }

            setAppliedPromo({
                code: coupon.code,
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value,
                maxDiscount: coupon.max_discount,
            });

            Alert.alert('¡Código aplicado!', `Descuento de ${coupon.discount_type === 'percentage'
                ? `${coupon.discount_value}%`
                : `S/ ${coupon.discount_value.toFixed(2)}`
                } aplicado`);

        } catch (error) {
            console.error('Error applying promo code:', error);
            Alert.alert('Error', 'No se pudo validar el código');
        } finally {
            setPromoLoading(false);
        }
    };

    const removePromoCode = () => {
        setAppliedPromo(null);
        setPromoCode('');
    };

    const handlePlaceOrder = async () => {
        const finalAddress = currentAddress ? currentAddress.address : addressText;

        if (!finalAddress || !finalAddress.trim()) {
            Alert.alert('Error', 'Por favor ingresa o selecciona una dirección de entrega');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'Debes iniciar sesión para realizar un pedido');
            return;
        }

        setLoading(true);

        try {
            const orderItems = items.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.price,
                notes: item.notes,
                customizations: item.customizations,
            }));

            // Use coords from store or manual GPS or defaults
            const lat = currentAddress ? currentAddress.latitude : (locationCoords?.lat || -12.046374);
            const lng = currentAddress ? currentAddress.longitude : (locationCoords?.lng || -77.042793);

            // Crear el pedido
            const createdOrder = await orderService.createOrder({
                user_id: user.id,
                restaurant_id: restaurantId || '',
                items: orderItems,
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                total: total,
                delivery_address: finalAddress,
                delivery_latitude: lat,
                delivery_longitude: lng,
                notes: note,
                payment_method: paymentMethod,
            });

            setLoading(false);

            Alert.alert(
                '¡Pedido Confirmado!',
                'Tu pedido está siendo preparado.',
                [
                    {
                        text: 'Ver Estado',
                        onPress: () => {
                            clearCart();
                            navigation.replace('OrderTracking', { orderId: createdOrder.id });
                        }
                    }
                ]
            );

        } catch (error: any) {
            setLoading(false);
            console.error('Error al procesar pedido:', error);
            Alert.alert('Error', error.message || 'No se pudo procesar tu pedido.');
        }
    };

    const renderPaymentOption = (id: import('../../types').PaymentMethod, imageSource: any, label: string, color: string) => {
        const isSelected = paymentMethod === id;
        return (
            <TouchableOpacity
                style={[
                    styles.paymentCard,
                    isSelected && styles.paymentCardSelected
                ]}
                onPress={() => setPaymentMethod(id)}
                activeOpacity={0.7}
            >
                <View style={[styles.paymentIconContainer, { backgroundColor: isSelected ? color + '20' : COLORS.gray100 }]}>
                    {typeof imageSource === 'string' && imageSource.startsWith('http') ? (
                        <Image source={{ uri: imageSource }} style={styles.paymentImage} />
                    ) : (
                        <Ionicons name={imageSource} size={24} color={isSelected ? color : COLORS.gray500} />
                    )}
                </View>
                <Text style={[
                    styles.paymentLabel,
                    isSelected && { color: color, fontWeight: '700' }
                ]}>
                    {label}
                </Text>
                {isSelected && (
                    <View style={styles.checkIcon}>
                        <Ionicons name="checkmark-circle" size={16} color={color} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Sección Dirección */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Dirección de Entrega</Text>
                        <TouchableOpacity onPress={handleChangeAddress}>
                            <Text style={styles.changeAction}>Cambiar</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        {currentAddress ? (
                            <TouchableOpacity style={styles.selectedAddress} onPress={handleChangeAddress}>
                                <View style={styles.addressIconContainer}>
                                    <Ionicons name="location" size={24} color={COLORS.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.addressLabel}>{currentAddress.label}</Text>
                                    <Text style={styles.addressText}>{currentAddress.address}</Text>
                                    {currentAddress.details && (
                                        <Text style={styles.addressDetails}>{currentAddress.details}</Text>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                            </TouchableOpacity>
                        ) : (
                            <View>
                                <View style={styles.addressRow}>
                                    <TouchableOpacity onPress={handleGetLocation} style={styles.locationButton}>
                                        {locating ? (
                                            <ActivityIndicator size="small" color={COLORS.primary} />
                                        ) : (
                                            <Ionicons name="locate" size={24} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                    <View style={styles.addressInputContainer}>
                                        <Input
                                            value={addressText}
                                            onChangeText={(text) => {
                                                setAddressText(text);
                                                setCurrentAddress(null);
                                            }}
                                            placeholder="Ingresa dirección o usa GPS"
                                            containerStyle={{ marginBottom: 0 }}
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity onPress={handleGetLocation}>
                                    <Text style={styles.useGpsText}>
                                        {locating ? 'Buscando ubicación...' : 'Usar ubicación actual'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Método de Pago */}
                <View style={styles.section}>
                    <PaymentMethodSelector
                        selectedMethod={paymentMethod}
                        onSelect={setPaymentMethod}
                    />
                </View>

                {/* Horario de Entrega */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Horario de Entrega</Text>
                    <TouchableOpacity
                        style={styles.scheduleCard}
                        onPress={() => setShowScheduleModal(true)}
                    >
                        <View style={styles.scheduleInfo}>
                            <Ionicons
                                name={scheduledTime ? "calendar" : "flash"}
                                size={24}
                                color={COLORS.primary}
                            />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.scheduleLabel}>
                                    {scheduledTime ? 'Programado para' : 'Lo antes posible'}
                                </Text>
                                <Text style={styles.scheduleTime}>
                                    {scheduledTime
                                        ? format(scheduledTime, "EEEE d 'de' MMM, h:mm a", { locale: es })
                                        : '~30-45 minutos'
                                    }
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>

                {/* Código Promocional */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>¿Tienes un código?</Text>
                    <View style={styles.card}>
                        {appliedPromo ? (
                            <View style={styles.appliedPromoContainer}>
                                <View style={styles.appliedPromoInfo}>
                                    <Ionicons name="pricetag" size={20} color={COLORS.success} />
                                    <View style={{ marginLeft: 10, flex: 1 }}>
                                        <Text style={styles.appliedPromoCode}>{appliedPromo.code}</Text>
                                        <Text style={styles.appliedPromoDiscount}>
                                            {appliedPromo.discountType === 'percentage'
                                                ? `${appliedPromo.discountValue}% de descuento`
                                                : `S/ ${appliedPromo.discountValue.toFixed(2)} de descuento`}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={removePromoCode}>
                                        <Ionicons name="close-circle" size={24} color={COLORS.gray400} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.promoInputContainer}>
                                <Input
                                    value={promoCode}
                                    onChangeText={setPromoCode}
                                    placeholder="Ingresa tu código"
                                    containerStyle={{ flex: 1, marginBottom: 0 }}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={applyPromoCode}
                                    disabled={promoLoading}
                                >
                                    {promoLoading ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.applyButtonText}>Aplicar</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Resumen */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen del Pedido</Text>
                    <View style={styles.card}>
                        {items.map((item) => (
                            <View key={item.product.id} style={styles.summaryItem}>
                                <Text style={styles.summaryQty}>{item.quantity}x</Text>
                                <Text style={styles.summaryName}>{item.product.name}</Text>
                                <Text style={styles.summaryPrice}>
                                    S/. {(item.product.price * item.quantity).toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Nota Adicional */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nota para el restaurante</Text>
                    <View style={styles.card}>
                        <Input
                            value={note}
                            onChangeText={setNote}
                            placeholder="Ej: Sin cebolla, extra servilletas..."
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </View>

                {/* Propina */}
                <View style={styles.section}>
                    <TipSelector
                        subtotal={subtotal}
                        selectedTip={selectedTip}
                        onTipChange={setSelectedTip}
                    />
                </View>

                {/* Instrucciones de Entrega */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 Instrucciones para el repartidor</Text>
                    <View style={styles.card}>
                        <View style={styles.deliveryTagsContainer}>
                            {[
                                { icon: '🔔', label: 'Tocar timbre' },
                                { icon: '🚪', label: 'Dejar en puerta' },
                                { icon: '📞', label: 'Llamar al llegar' },
                                { icon: '🐕', label: 'Cuidado con mascota' },
                                { icon: '🏢', label: 'Edificio/Depto' },
                                { icon: '🚗', label: 'Esperar afuera' },
                            ].map((tag, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.deliveryTag,
                                        deliveryInstructions.includes(tag.label) && styles.deliveryTagActive,
                                    ]}
                                    onPress={() => {
                                        if (deliveryInstructions.includes(tag.label)) {
                                            setDeliveryInstructions(
                                                deliveryInstructions.filter((t: string) => t !== tag.label)
                                            );
                                        } else {
                                            setDeliveryInstructions([...deliveryInstructions, tag.label]);
                                        }
                                    }}
                                >
                                    <Text style={styles.deliveryTagIcon}>{tag.icon}</Text>
                                    <Text style={[
                                        styles.deliveryTagText,
                                        deliveryInstructions.includes(tag.label) && styles.deliveryTagTextActive,
                                    ]}>{tag.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Input
                            value={deliveryNote}
                            onChangeText={setDeliveryNote}
                            placeholder="Instrucciones adicionales para el repartidor..."
                            multiline
                            numberOfLines={2}
                            containerStyle={{ marginTop: SIZES.sm }}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Footer Totales */}
            <View style={styles.footer}>
                <View style={styles.row}>
                    <Text style={styles.label}>Subtotal</Text>
                    <Text style={styles.value}>S/. {subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Delivery</Text>
                    <Text style={styles.value}>S/. {deliveryFee.toFixed(2)}</Text>
                </View>
                {discount > 0 && (
                    <View style={styles.row}>
                        <Text style={[styles.label, { color: COLORS.success }]}>Descuento</Text>
                        <Text style={[styles.value, { color: COLORS.success }]}>-S/. {discount.toFixed(2)}</Text>
                    </View>
                )}
                {selectedTip > 0 && (
                    <View style={styles.row}>
                        <Text style={[styles.label, { color: COLORS.accent }]}>Propina</Text>
                        <Text style={[styles.value, { color: COLORS.accent }]}>S/. {selectedTip.toFixed(2)}</Text>
                    </View>
                )}
                <View style={[styles.row, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total a Pagar</Text>
                    <Text style={styles.totalValue}>S/. {total.toFixed(2)}</Text>
                </View>

                <Button
                    title={`Confirmar Pedido • S/. ${total.toFixed(2)}`}
                    onPress={handlePlaceOrder}
                    loading={loading}
                    style={styles.confirmButton}
                    size="large"
                />
            </View>

            {/* Scheduled Delivery Modal */}
            <ScheduledDeliveryModal
                visible={showScheduleModal}
                onConfirm={(time) => {
                    setScheduledTime(time);
                    setShowScheduleModal(false);
                }}
                onCancel={() => setShowScheduleModal(false)}
            />
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
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    content: {
        padding: SIZES.lg,
        paddingBottom: 180, // Extra padding for fixed footer
    },
    section: {
        marginBottom: SIZES.xl,
    },
    sectionTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: SIZES.sm,
        marginLeft: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    changeAction: {
        fontSize: SIZES.fontMd,
        color: COLORS.primary,
        fontWeight: '600',
    },
    selectedAddress: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    addressIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addressLabel: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: 4,
    },
    addressText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
        lineHeight: 20,
    },
    addressDetails: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
        fontStyle: 'italic',
        marginTop: 2,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        ...SHADOWS.small,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIZES.sm,
    },
    locationButton: {
        padding: 8,
        backgroundColor: COLORS.gray100,
        borderRadius: SIZES.radiusSm,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    addressInputContainer: {
        flex: 1,
    },
    useGpsText: {
        fontSize: SIZES.fontSm,
        color: COLORS.primary,
        fontWeight: '600',
        textAlign: 'right',
        marginTop: -8,
    },
    // New Payment Grid Styles
    paymentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    paymentCard: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    paymentCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    paymentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentImage: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
        borderRadius: 8,
    },
    paymentLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.gray600,
        textAlign: 'center',
    },
    paymentLabelSelected: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    checkIcon: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: 4,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SIZES.sm,
    },
    summaryQty: {
        fontWeight: '700',
        color: COLORS.primary,
        width: 30,
    },
    summaryName: {
        flex: 1,
        color: COLORS.gray800,
    },
    summaryPrice: {
        fontWeight: '600',
        color: COLORS.gray900,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        padding: SIZES.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        ...SHADOWS.medium,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: COLORS.gray500,
        fontSize: SIZES.fontSm,
    },
    value: {
        color: COLORS.gray900,
        fontWeight: '500',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
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
    confirmButton: {
        width: '100%',
    },
    // Promo code styles
    promoInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIZES.sm,
    },
    applyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.md,
        borderRadius: SIZES.radiusMd,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: SIZES.fontSm,
    },
    appliedPromoContainer: {
        backgroundColor: COLORS.success + '10',
        borderRadius: SIZES.radiusMd,
        padding: SIZES.sm,
    },
    appliedPromoInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appliedPromoCode: {
        fontWeight: '700',
        color: COLORS.gray900,
        fontSize: SIZES.fontMd,
    },
    appliedPromoDiscount: {
        color: COLORS.success,
        fontSize: SIZES.fontSm,
    },
    // Schedule styles
    scheduleCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.small,
    },
    scheduleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    scheduleLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    scheduleTime: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray800,
        marginTop: 2,
    },
    // Delivery instructions styles
    deliveryTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SIZES.sm,
    },
    deliveryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusFull,
        gap: 4,
    },
    deliveryTagActive: {
        backgroundColor: COLORS.primary + '20',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    deliveryTagIcon: {
        fontSize: 14,
    },
    deliveryTagText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
    },
    deliveryTagTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});

export default CheckoutScreen;
