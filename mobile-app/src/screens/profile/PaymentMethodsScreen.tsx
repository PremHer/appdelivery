import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants';
import Button from '../../components/ui/Button';

interface PaymentMethodsScreenProps {
    navigation: any;
}

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ navigation }) => {
    // Mock de tarjetas guardadas
    const methods = [
        { id: '1', type: 'visa', last4: '4242', expiry: '12/26' },
    ];

    const handleAddCard = () => {
        Alert.alert('Próximamente', 'Estamos integrando la pasarela de pagos segura.');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
                <Text style={styles.title}>Métodos de Pago</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {methods.map((method) => (
                    <View key={method.id} style={styles.card}>
                        <View style={styles.cardInfo}>
                            <Ionicons name="card-outline" size={24} color={COLORS.primary} />
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>Visa terminada en {method.last4}</Text>
                                <Text style={styles.cardExpiry}>Vence: {method.expiry}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => Alert.alert('Eliminar', '¿Eliminar tarjeta?')}>
                            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>
                ))}

                <Button
                    title="Agregar Tarjeta"
                    onPress={handleAddCard}
                    variant="outline"
                    icon={<Ionicons name="add" size={20} color={COLORS.primary} />}
                    style={styles.addButton}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SIZES.lg,
        backgroundColor: COLORS.white,
        ...SHADOWS.small,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    content: {
        padding: SIZES.lg,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: SIZES.md,
        borderRadius: SIZES.radiusMd,
        marginBottom: SIZES.md,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIZES.md,
    },
    textContainer: {
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray900,
    },
    cardExpiry: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    addButton: {
        marginTop: SIZES.lg,
        borderStyle: 'dashed',
    }
});

export default PaymentMethodsScreen;
