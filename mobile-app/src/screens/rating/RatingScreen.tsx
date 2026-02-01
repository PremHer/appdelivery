import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants';
import Button from '../../components/ui/Button';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../context/stores';

interface RatingScreenProps {
    navigation: any;
    route: {
        params: {
            orderId: string;
            restaurantId: string;
            restaurantName: string;
        };
    };
}

const RatingScreen: React.FC<RatingScreenProps> = ({ navigation, route }) => {
    const { orderId, restaurantId, restaurantName } = route.params;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const user = useAuthStore((state) => state.user);

    const ratingLabels = [
        '',
        'Muy malo 😞',
        'Malo 😕',
        'Regular 😐',
        'Bueno 😊',
        'Excelente 🤩',
    ];

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Calificación requerida', 'Por favor selecciona una calificación');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'Debes estar logueado para calificar');
            return;
        }

        setSubmitting(true);

        try {
            // Insert the review
            const { error: reviewError } = await supabase
                .from('reviews')
                .insert({
                    user_id: user.id,
                    restaurant_id: restaurantId,
                    order_id: orderId,
                    rating,
                    comment: comment.trim() || null,
                });

            if (reviewError) {
                if (reviewError.message.includes('duplicate')) {
                    Alert.alert('Ya calificaste', 'Ya has calificado este pedido anteriormente');
                } else {
                    throw reviewError;
                }
                return;
            }

            // Update restaurant average rating
            const { data: reviews } = await supabase
                .from('reviews')
                .select('rating')
                .eq('restaurant_id', restaurantId);

            if (reviews && reviews.length > 0) {
                const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

                await supabase
                    .from('restaurants')
                    .update({
                        rating: Math.round(avgRating * 10) / 10,
                        total_reviews: reviews.length
                    })
                    .eq('id', restaurantId);
            }

            Alert.alert(
                '¡Gracias por tu opinión!',
                'Tu calificación nos ayuda a mejorar el servicio',
                [{ text: 'OK', onPress: () => navigation.navigate('MainTabs') }]
            );
        } catch (error: any) {
            console.error('Error submitting review:', error);
            Alert.alert('Error', 'No se pudo enviar tu calificación. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        navigation.navigate('MainTabs');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                            <Text style={styles.skipText}>Saltar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Main Content */}
                    <View style={styles.mainContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="star" size={60} color={COLORS.warning} />
                        </View>

                        <Text style={styles.title}>¿Cómo estuvo tu pedido?</Text>
                        <Text style={styles.subtitle}>
                            Califica tu experiencia con {restaurantName}
                        </Text>

                        {/* Stars */}
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={48}
                                        color={star <= rating ? COLORS.warning : COLORS.gray300}
                                        style={styles.star}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {rating > 0 && (
                            <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
                        )}

                        {/* Comment */}
                        <View style={styles.commentContainer}>
                            <Text style={styles.commentLabel}>
                                ¿Quieres agregar un comentario? (opcional)
                            </Text>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Cuéntanos tu experiencia..."
                                placeholderTextColor={COLORS.gray400}
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>{comment.length}/500</Text>
                        </View>

                        {/* Quick Tags */}
                        {rating >= 4 && (
                            <View style={styles.tagsContainer}>
                                <Text style={styles.tagsLabel}>¿Qué te gustó?</Text>
                                <View style={styles.tags}>
                                    {['Rapidez', 'Calidad', 'Atención', 'Precio'].map((tag) => (
                                        <TouchableOpacity
                                            key={tag}
                                            style={[
                                                styles.tag,
                                                comment.includes(tag) && styles.tagActive,
                                            ]}
                                            onPress={() => {
                                                if (comment.includes(tag)) {
                                                    setComment(comment.replace(tag + ' ', ''));
                                                } else {
                                                    setComment(tag + ' ' + comment);
                                                }
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.tagText,
                                                    comment.includes(tag) && styles.tagTextActive,
                                                ]}
                                            >
                                                {tag}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {rating > 0 && rating <= 2 && (
                            <View style={styles.tagsContainer}>
                                <Text style={styles.tagsLabel}>¿Qué podemos mejorar?</Text>
                                <View style={styles.tags}>
                                    {['Demora', 'Producto', 'Empaque', 'Servicio'].map((tag) => (
                                        <TouchableOpacity
                                            key={tag}
                                            style={[
                                                styles.tag,
                                                comment.includes(tag) && styles.tagActive,
                                            ]}
                                            onPress={() => {
                                                if (comment.includes(tag)) {
                                                    setComment(comment.replace(tag + ' ', ''));
                                                } else {
                                                    setComment(tag + ' ' + comment);
                                                }
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.tagText,
                                                    comment.includes(tag) && styles.tagTextActive,
                                                ]}
                                            >
                                                {tag}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Button
                        title={submitting ? 'Enviando...' : 'Enviar Calificación'}
                        onPress={handleSubmit}
                        disabled={rating === 0 || submitting}
                        style={{ opacity: rating === 0 ? 0.5 : 1 }}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    content: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.md,
    },
    skipButton: {
        padding: SIZES.sm,
    },
    skipText: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        fontWeight: '600',
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: SIZES.xl,
        paddingTop: SIZES.xl,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.warning + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.lg,
    },
    title: {
        fontSize: SIZES.fontXxl,
        fontWeight: '700',
        color: COLORS.gray900,
        textAlign: 'center',
        marginBottom: SIZES.sm,
    },
    subtitle: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        textAlign: 'center',
        marginBottom: SIZES.xl,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SIZES.md,
    },
    star: {
        marginHorizontal: 4,
    },
    ratingLabel: {
        fontSize: SIZES.fontLg,
        fontWeight: '600',
        color: COLORS.gray700,
        marginBottom: SIZES.lg,
    },
    commentContainer: {
        width: '100%',
        marginTop: SIZES.md,
    },
    commentLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
        marginBottom: SIZES.sm,
    },
    commentInput: {
        width: '100%',
        height: 100,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        fontSize: SIZES.fontMd,
        color: COLORS.gray800,
        backgroundColor: COLORS.gray50,
    },
    charCount: {
        fontSize: SIZES.fontXs,
        color: COLORS.gray400,
        textAlign: 'right',
        marginTop: 4,
    },
    tagsContainer: {
        width: '100%',
        marginTop: SIZES.lg,
    },
    tagsLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
        marginBottom: SIZES.sm,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SIZES.sm,
    },
    tag: {
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusFull,
        backgroundColor: COLORS.gray100,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    tagActive: {
        backgroundColor: COLORS.primary + '15',
        borderColor: COLORS.primary,
    },
    tagText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
        fontWeight: '500',
    },
    tagTextActive: {
        color: COLORS.primary,
    },
    footer: {
        padding: SIZES.lg,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        ...SHADOWS.small,
    },
});

export default RatingScreen;
