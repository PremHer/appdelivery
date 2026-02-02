import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants';
import { useCartStore } from '../../context/stores';
import Button from '../../components/ui/Button';
import { supabase } from '../../services/supabase';
import type { ProductOption, ProductOptionItem } from '../../types';

interface ProductDetailScreenProps {
    navigation: any;
    route: any;
}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ navigation, route }) => {
    const { product } = route.params;
    const { addItem } = useCartStore();

    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    // Dynamic Options State
    const [options, setOptions] = useState<ProductOption[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, ProductOptionItem[]>>({});
    const [loadingOptions, setLoadingOptions] = useState(true);

    useEffect(() => {
        fetchProductOptions();
    }, [product.id]);

    const fetchProductOptions = async () => {
        try {
            const { data, error } = await supabase
                .from('product_options')
                .select(`
                    *,
                    items:product_option_items(*)
                `)
                .eq('product_id', product.id);

            if (error) throw error;
            setOptions(data || []);
        } catch (error) {
            console.error('Error fetching options:', error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleToggleOption = (option: ProductOption, item: ProductOptionItem) => {
        setSelectedOptions(prev => {
            const currentSelected = prev[option.id] || [];
            const isSelected = currentSelected.some(i => i.id === item.id);

            if (option.max_selections === 1) {
                // Radio behavior: Replace selection
                // Toggle off if clicking same item (optional, depending on UX. Usually radio requires one selection if required)
                return { ...prev, [option.id]: [item] };
            } else {
                // Checkbox behavior
                if (isSelected) {
                    return { ...prev, [option.id]: currentSelected.filter(i => i.id !== item.id) };
                } else {
                    if (currentSelected.length >= option.max_selections) {
                        Alert.alert('Límite alcanzado', `Solo puedes seleccionar hasta ${option.max_selections} opciones.`);
                        return prev;
                    }
                    return { ...prev, [option.id]: [...currentSelected, item] };
                }
            }
        });
    };

    const validateSelections = (): boolean => {
        for (const option of options) {
            if (option.is_required) {
                const selected = selectedOptions[option.id];
                if (!selected || selected.length === 0) {
                    Alert.alert('Faltan opciones', `Por favor selecciona: ${option.name}`);
                    return false;
                }
            }
        }
        return true;
    };

    const calculateTotal = () => {
        let total = product.price;
        Object.values(selectedOptions).flat().forEach(opt => {
            total += (opt.price_modifier || 0);
        });
        return total * quantity;
    };

    const handleAddToCart = () => {
        if (!validateSelections()) return;

        // Flatten selections for cart
        const flatSelectedOptions = Object.values(selectedOptions).flat();

        addItem({
            product,
            quantity,
            notes,
            selectedOptions: flatSelectedOptions,
            customizations: {
                // Legacy support if needed, or structured data
            }
        });

        Alert.alert(
            '¡Agregado!',
            `${quantity}x ${product.name} agregado al carrito.`,
            [
                { text: 'Seguir comprando', onPress: () => navigation.goBack() },
                { text: 'Ir al carrito', onPress: () => navigation.navigate('Cart') }
            ]
        );
    };

    const increment = () => setQuantity(q => q + 1);
    const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Image
                    source={{ uri: product.image_url || 'https://via.placeholder.com/300' }}
                    style={styles.image}
                />

                <View style={styles.content}>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.description}>{product.description}</Text>
                    <Text style={styles.price}>S/. {product.price.toFixed(2)}</Text>

                    <View style={styles.divider} />

                    {loadingOptions ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        options.map(option => (
                            <View key={option.id} style={styles.optionSection}>
                                <View style={styles.optionHeader}>
                                    <Text style={styles.sectionTitle}>{option.name}</Text>
                                    {option.is_required && (
                                        <View style={styles.requiredBadge}>
                                            <Text style={styles.requiredText}>Obligatorio</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.optionSubtitle}>
                                    {option.max_selections === 1
                                        ? 'Elige 1'
                                        : `Elige hasta ${option.max_selections}`}
                                </Text>

                                <View style={styles.optionsContainer}>
                                    {option.items?.map(item => {
                                        const isSelected = selectedOptions[option.id]?.some(i => i.id === item.id);
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={styles.optionRow}
                                                onPress={() => handleToggleOption(option, item)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={styles.optionInfo}>
                                                    <Text style={styles.optionText}>{item.name}</Text>
                                                    {item.price_modifier > 0 && (
                                                        <Text style={styles.optionPrice}>
                                                            + S/. {item.price_modifier.toFixed(2)}
                                                        </Text>
                                                    )}
                                                </View>

                                                <View style={[
                                                    styles.checkbox,
                                                    isSelected && styles.checkboxSelected,
                                                    option.max_selections === 1 && styles.radio
                                                ]}>
                                                    {isSelected && (
                                                        <View style={option.max_selections === 1 ? styles.radioInner : null}>
                                                            {option.max_selections > 1 && (
                                                                <Ionicons name="checkmark" size={14} color={COLORS.white} />
                                                            )}
                                                        </View>
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                <View style={styles.divider} />
                            </View>
                        ))
                    )}

                    <Text style={styles.sectionTitle}>Instrucciones Especiales</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Sin cebolla, extra picante..."
                        multiline
                        numberOfLines={3}
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity onPress={decrement} style={styles.qtyButton}>
                        <Ionicons name="remove" size={24} color={COLORS.gray900} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{quantity}</Text>
                    <TouchableOpacity onPress={increment} style={styles.qtyButton}>
                        <Ionicons name="add" size={24} color={COLORS.gray900} />
                    </TouchableOpacity>
                </View>

                <Button
                    title={`Agregar S/${calculateTotal().toFixed(2)}`}
                    onPress={handleAddToCart}
                    style={{ ...styles.addButton, backgroundColor: COLORS.accent }}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
    },
    backButton: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 8,
        ...SHADOWS.small,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    image: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    content: {
        padding: SIZES.lg,
    },
    name: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: 8,
    },
    description: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray600,
        marginBottom: 16,
        lineHeight: 20,
    },
    price: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: SIZES.lg,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: SIZES.lg,
    },
    optionSection: {
        marginBottom: SIZES.md,
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    requiredBadge: {
        backgroundColor: COLORS.gray200,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    requiredText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.gray600,
        textTransform: 'uppercase',
    },
    optionSubtitle: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
        marginBottom: 8,
    },
    optionsContainer: {
        gap: 12,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    optionInfo: {
        flex: 1,
    },
    optionText: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray800,
    },
    optionPrice: {
        fontSize: SIZES.fontSm,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.gray300,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkboxSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    radio: {
        borderRadius: 12,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.white,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        fontSize: SIZES.fontMd,
        textAlignVertical: 'top',
        minHeight: 80,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        padding: SIZES.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIZES.md,
        ...SHADOWS.medium,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: SIZES.radiusMd,
        padding: 4,
    },
    qtyButton: {
        padding: 8,
    },
    qtyText: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        marginHorizontal: 16,
    },
    addButton: {
        flex: 1,
    },
});

export default ProductDetailScreen;
