import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../context/stores';

interface RatingModalProps {
    visible: boolean;
    onClose: () => void;
    orderId: string;
    restaurantId: string;
    restaurantName: string;
    driverId: string;
    driverName: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
    visible,
    onClose,
    orderId,
    restaurantId,
    restaurantName,
    driverId,
    driverName,
}) => {
    const { user } = useAuthStore();
    const [restaurantRating, setRestaurantRating] = useState(0);
    const [driverRating, setDriverRating] = useState(0);
    const [restaurantComment, setRestaurantComment] = useState('');
    const [driverComment, setDriverComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<'restaurant' | 'driver' | 'done'>('restaurant');

    const handleSubmit = async () => {
        if (!user) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.from('ratings').insert({
                order_id: orderId,
                user_id: user.id,
                restaurant_id: restaurantId,
                restaurant_rating: restaurantRating > 0 ? restaurantRating : null,
                restaurant_comment: restaurantComment || null,
                driver_id: driverId,
                driver_rating: driverRating > 0 ? driverRating : null,
                driver_comment: driverComment || null,
            });

            if (error) {
                console.error('Error submitting rating:', error);
            }

            setStep('done');
            setTimeout(() => {
                onClose();
                // Reset state
                setRestaurantRating(0);
                setDriverRating(0);
                setRestaurantComment('');
                setDriverComment('');
                setStep('restaurant');
            }, 1500);
        } catch (error) {
            console.error('Error submitting rating:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number, setRating: (val: number) => void) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        style={styles.starButton}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={40}
                            color={star <= rating ? '#FFD700' : COLORS.gray300}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const getRatingText = (rating: number) => {
        if (rating === 0) return 'Toca para calificar';
        if (rating === 1) return 'Muy malo 😞';
        if (rating === 2) return 'Malo 😕';
        if (rating === 3) return 'Regular 😐';
        if (rating === 4) return 'Bueno 😊';
        return '¡Excelente! 🤩';
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {step === 'done' ? (
                        <View style={styles.doneContainer}>
                            <View style={styles.checkCircle}>
                                <Ionicons name="checkmark" size={48} color={COLORS.white} />
                            </View>
                            <Text style={styles.doneTitle}>¡Gracias por tu opinión!</Text>
                            <Text style={styles.doneSubtitle}>
                                Tu calificación nos ayuda a mejorar
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>
                                    {step === 'restaurant' ? 'Califica tu pedido' : 'Califica al repartidor'}
                                </Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={COLORS.gray600} />
                                </TouchableOpacity>
                            </View>

                            {/* Restaurant Rating */}
                            {step === 'restaurant' && (
                                <View style={styles.ratingSection}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="restaurant" size={32} color={COLORS.white} />
                                    </View>
                                    <Text style={styles.targetName}>{restaurantName}</Text>
                                    <Text style={styles.question}>¿Cómo estuvo la comida?</Text>

                                    {renderStars(restaurantRating, setRestaurantRating)}
                                    <Text style={styles.ratingText}>{getRatingText(restaurantRating)}</Text>

                                    <TextInput
                                        style={styles.commentInput}
                                        placeholder="Cuéntanos más (opcional)"
                                        placeholderTextColor={COLORS.gray400}
                                        value={restaurantComment}
                                        onChangeText={setRestaurantComment}
                                        multiline
                                        maxLength={200}
                                    />

                                    <TouchableOpacity
                                        style={[
                                            styles.nextButton,
                                            restaurantRating === 0 && styles.nextButtonDisabled,
                                        ]}
                                        onPress={() => setStep('driver')}
                                        disabled={restaurantRating === 0}
                                    >
                                        <Text style={styles.nextButtonText}>Siguiente</Text>
                                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Driver Rating */}
                            {step === 'driver' && (
                                <View style={styles.ratingSection}>
                                    <View style={[styles.iconCircle, { backgroundColor: COLORS.success }]}>
                                        <Ionicons name="bicycle" size={32} color={COLORS.white} />
                                    </View>
                                    <Text style={styles.targetName}>{driverName}</Text>
                                    <Text style={styles.question}>¿Cómo fue la entrega?</Text>

                                    {renderStars(driverRating, setDriverRating)}
                                    <Text style={styles.ratingText}>{getRatingText(driverRating)}</Text>

                                    <TextInput
                                        style={styles.commentInput}
                                        placeholder="Cuéntanos más (opcional)"
                                        placeholderTextColor={COLORS.gray400}
                                        value={driverComment}
                                        onChangeText={setDriverComment}
                                        multiline
                                        maxLength={200}
                                    />

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={styles.backButton}
                                            onPress={() => setStep('restaurant')}
                                        >
                                            <Ionicons name="arrow-back" size={20} color={COLORS.gray600} />
                                            <Text style={styles.backButtonText}>Atrás</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.submitButton,
                                                (driverRating === 0 || submitting) && styles.submitButtonDisabled,
                                            ]}
                                            onPress={handleSubmit}
                                            disabled={driverRating === 0 || submitting}
                                        >
                                            {submitting ? (
                                                <ActivityIndicator color={COLORS.white} size="small" />
                                            ) : (
                                                <>
                                                    <Text style={styles.submitButtonText}>Enviar</Text>
                                                    <Ionicons name="checkmark" size={20} color={COLORS.white} />
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Skip Option */}
                            <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                                <Text style={styles.skipText}>Omitir por ahora</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.gray800,
    },
    closeButton: {
        padding: 4,
    },
    ratingSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    targetName: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.gray800,
        marginBottom: 4,
    },
    question: {
        fontSize: 15,
        color: COLORS.gray500,
        marginBottom: 20,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.gray700,
        marginBottom: 20,
        height: 24,
    },
    commentInput: {
        width: '100%',
        minHeight: 80,
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: COLORS.gray800,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
        width: '100%',
    },
    nextButtonDisabled: {
        backgroundColor: COLORS.gray300,
    },
    nextButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.gray100,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    backButtonText: {
        color: COLORS.gray600,
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.success,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    submitButtonDisabled: {
        backgroundColor: COLORS.gray300,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    skipText: {
        color: COLORS.gray500,
        fontSize: 14,
    },
    doneContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    doneTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.gray800,
        marginBottom: 8,
    },
    doneSubtitle: {
        fontSize: 15,
        color: COLORS.gray500,
    },
});

export default RatingModal;
