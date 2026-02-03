import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import type { PaymentMethod } from '../../types';

interface PaymentOption {
    id: PaymentMethod;
    name: string;
    description: string;
    icon: string;
    color: string;
    phone?: string; // Phone number for transfers
    lemonTag?: string; // Lemon Cash tag
}

const PAYMENT_OPTIONS: PaymentOption[] = [
    {
        id: 'cash',
        name: 'Efectivo',
        description: 'Paga al recibir tu pedido',
        icon: 'cash-outline',
        color: '#4CAF50',
    },
    {
        id: 'yape',
        name: 'Yape',
        description: 'Transfiere al número del negocio',
        icon: 'phone-portrait-outline',
        color: '#6B2D83', // Yape purple
        phone: '967795837',
    },
    {
        id: 'plin',
        name: 'Plin',
        description: 'Paga con Plin al número indicado',
        icon: 'phone-portrait-outline',
        color: '#00D4AA', // Plin teal
        phone: '967795837',
    },
    {
        id: 'lemon',
        name: 'Lemon Cash',
        description: 'Paga con criptomonedas',
        icon: 'logo-bitcoin',
        color: '#FFD700',
        phone: '967795837',
        lemonTag: '@sajino',
    },
    {
        id: 'billetera_bcp',
        name: 'Billetera BCP',
        description: 'Transferencia desde Billetera BCP',
        icon: 'wallet-outline',
        color: '#0033A0',
        phone: '967795837',
    },
    {
        id: 'tunki',
        name: 'Tunki',
        description: 'Paga con tu billetera Tunki',
        icon: 'wallet-outline',
        color: '#E91E63',
        phone: '967795837',
    },
    {
        id: 'pos',
        name: 'POS (Tarjeta)',
        description: 'El repartidor llevará un POS',
        icon: 'card-outline',
        color: '#2196F3',
    },
];

interface PaymentMethodSelectorProps {
    selectedMethod: PaymentMethod;
    onSelect: (method: PaymentMethod) => void;
    businessPhone?: string; // Override default phone
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    selectedMethod,
    onSelect,
    businessPhone,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Método de Pago</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {PAYMENT_OPTIONS.map((option) => {
                    const isSelected = selectedMethod === option.id;
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionCard,
                                isSelected && styles.optionCardSelected,
                                isSelected && { borderColor: option.color },
                            ]}
                            onPress={() => onSelect(option.id)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: option.color + '20' },
                                ]}
                            >
                                <Ionicons
                                    name={option.icon as any}
                                    size={24}
                                    color={option.color}
                                />
                            </View>
                            <Text style={styles.optionName}>{option.name}</Text>
                            {isSelected && (
                                <View style={[styles.checkmark, { backgroundColor: option.color }]}>
                                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Selected method description */}
            {selectedMethod && (
                <View style={styles.descriptionContainer}>
                    {(() => {
                        const selected = PAYMENT_OPTIONS.find(o => o.id === selectedMethod);
                        if (!selected) return null;

                        return (
                            <>
                                <View style={styles.descriptionHeader}>
                                    <Ionicons
                                        name={selected.icon as any}
                                        size={20}
                                        color={selected.color}
                                    />
                                    <Text style={styles.descriptionTitle}>{selected.name}</Text>
                                </View>
                                <Text style={styles.descriptionText}>{selected.description}</Text>

                                {/* Show phone number for wallet payments */}
                                {selected.phone && (
                                    <View style={styles.phoneContainer}>
                                        <Ionicons name="call" size={16} color={COLORS.gray600} />
                                        <Text style={styles.phoneLabel}>Número para transferir:</Text>
                                        <Text style={styles.phoneNumber}>
                                            {businessPhone || selected.phone}
                                        </Text>
                                    </View>
                                )}

                                {/* Special instructions */}
                                {(selected.id === 'yape' || selected.id === 'plin') && (
                                    <View style={styles.instructionBox}>
                                        <Ionicons name="information-circle" size={18} color={COLORS.primary} />
                                        <Text style={styles.instructionText}>
                                            Realiza la transferencia y envía el comprobante al chat después de confirmar el pedido
                                        </Text>
                                    </View>
                                )}

                                {/* Lemon Cash tag */}
                                {selected.id === 'lemon' && selected.lemonTag && (
                                    <>
                                        <View style={styles.phoneContainer}>
                                            <Ionicons name="at" size={16} color="#FFD700" />
                                            <Text style={styles.phoneLabel}>Tag de Lemon:</Text>
                                            <Text style={[styles.phoneNumber, { color: '#FFD700' }]}>
                                                {selected.lemonTag}
                                            </Text>
                                        </View>
                                        <View style={styles.instructionBox}>
                                            <Ionicons name="information-circle" size={18} color="#FFD700" />
                                            <Text style={styles.instructionText}>
                                                Busca el tag en Lemon Cash y transfiere. Envía captura al chat.
                                            </Text>
                                        </View>
                                    </>
                                )}

                                {selected.id === 'cash' && (
                                    <View style={styles.instructionBox}>
                                        <Ionicons name="wallet" size={18} color={COLORS.success} />
                                        <Text style={styles.instructionText}>
                                            Ten el monto exacto listo para una entrega más rápida
                                        </Text>
                                    </View>
                                )}
                            </>
                        );
                    })()}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SIZES.md,
    },
    title: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: SIZES.sm,
    },
    scrollContent: {
        paddingRight: SIZES.md,
        gap: 12,
    },
    optionCard: {
        width: 90,
        padding: 12,
        borderRadius: SIZES.radiusMd,
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.gray200,
        alignItems: 'center',
        position: 'relative',
    },
    optionCardSelected: {
        backgroundColor: COLORS.gray50,
        borderWidth: 2,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionName: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.gray800,
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    descriptionContainer: {
        marginTop: SIZES.md,
        padding: SIZES.md,
        backgroundColor: COLORS.gray50,
        borderRadius: SIZES.radiusMd,
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    descriptionTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    descriptionText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
        marginBottom: SIZES.sm,
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.white,
        padding: 10,
        borderRadius: SIZES.radiusSm,
        marginTop: 8,
    },
    phoneLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
    },
    phoneNumber: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: SIZES.sm,
        padding: 10,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusSm,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    instructionText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.gray700,
        lineHeight: 18,
    },
});

export default PaymentMethodSelector;
