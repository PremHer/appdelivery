import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants';
import Button from '../ui/Button';

interface AgeVerificationModalProps {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    storeName?: string;
}

const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
    visible,
    onConfirm,
    onCancel,
    storeName,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🍷</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Verificación de Edad</Text>

                    {/* Description */}
                    <Text style={styles.description}>
                        {storeName
                            ? `${storeName} vende productos que requieren ser mayor de edad.`
                            : 'Esta tienda vende productos que requieren ser mayor de edad.'
                        }
                    </Text>

                    <Text style={styles.question}>
                        ¿Confirmas que tienes 18 años o más?
                    </Text>

                    {/* Warning */}
                    <View style={styles.warningBox}>
                        <Ionicons name="warning" size={20} color={COLORS.warning} />
                        <Text style={styles.warningText}>
                            Al confirmar, aceptas que eres mayor de edad y que se te puede solicitar
                            identificación al momento de la entrega.
                        </Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelButtonText}>No, soy menor</Text>
                        </TouchableOpacity>

                        <Button
                            title="Sí, soy mayor de 18"
                            onPress={onConfirm}
                            style={styles.confirmButton}
                        />
                    </View>

                    {/* Legal text */}
                    <Text style={styles.legalText}>
                        La venta de alcohol a menores de edad está prohibida por ley.
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.lg,
    },
    container: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.xl,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        ...SHADOWS.large,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.warning + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.lg,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: SIZES.sm,
        textAlign: 'center',
    },
    description: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray600,
        textAlign: 'center',
        marginBottom: SIZES.md,
        lineHeight: 22,
    },
    question: {
        fontSize: SIZES.fontLg,
        fontWeight: '600',
        color: COLORS.gray800,
        textAlign: 'center',
        marginBottom: SIZES.lg,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: COLORS.warning + '10',
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        marginBottom: SIZES.lg,
        gap: SIZES.sm,
    },
    warningText: {
        flex: 1,
        fontSize: SIZES.fontSm,
        color: COLORS.gray700,
        lineHeight: 18,
    },
    buttonContainer: {
        width: '100%',
        gap: SIZES.sm,
    },
    cancelButton: {
        paddingVertical: SIZES.md,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        fontWeight: '600',
    },
    confirmButton: {
        width: '100%',
    },
    legalText: {
        fontSize: SIZES.fontXs,
        color: COLORS.gray400,
        textAlign: 'center',
        marginTop: SIZES.md,
    },
});

export default AgeVerificationModal;
