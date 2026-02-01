import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants';

interface Review {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    user: {
        full_name: string;
        avatar_url: string | null;
    };
}

interface ReviewsModalProps {
    visible: boolean;
    onClose: () => void;
    reviews: Review[];
    restaurantName: string;
    averageRating: number;
    totalReviews: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ReviewsModal: React.FC<ReviewsModalProps> = ({
    visible,
    onClose,
    reviews,
    restaurantName,
    averageRating,
    totalReviews,
}) => {
    const renderReviewItem = ({ item }: { item: Review }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={18} color={COLORS.gray400} />
                    </View>
                    <View>
                        <Text style={styles.reviewerName}>
                            {(item.user as any)?.full_name || 'Usuario'}
                        </Text>
                        <Text style={styles.reviewDate}>
                            {new Date(item.created_at).toLocaleDateString('es-PE', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            })}
                        </Text>
                    </View>
                </View>
                <View style={styles.reviewRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                            key={star}
                            name={star <= item.rating ? 'star' : 'star-outline'}
                            size={14}
                            color={COLORS.warning}
                        />
                    ))}
                </View>
            </View>
            {item.comment && (
                <Text style={styles.reviewComment}>{item.comment}</Text>
            )}
        </View>
    );

    // Calculate rating distribution
    const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: reviews.filter(r => Math.round(r.rating) === rating).length,
        percentage: reviews.length > 0
            ? (reviews.filter(r => Math.round(r.rating) === rating).length / reviews.length) * 100
            : 0
    }));

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Reseñas</Text>
                            <Text style={styles.subtitle}>{restaurantName}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={COLORS.gray600} />
                        </TouchableOpacity>
                    </View>

                    {/* Rating Summary */}
                    <View style={styles.ratingSummary}>
                        <View style={styles.ratingMain}>
                            <Text style={styles.ratingBig}>{averageRating.toFixed(1)}</Text>
                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                        key={star}
                                        name={star <= Math.round(averageRating) ? 'star' : 'star-outline'}
                                        size={18}
                                        color={COLORS.warning}
                                    />
                                ))}
                            </View>
                            <Text style={styles.totalText}>{totalReviews} reseñas</Text>
                        </View>
                        <View style={styles.ratingBars}>
                            {ratingCounts.map(({ rating, percentage }) => (
                                <View key={rating} style={styles.barRow}>
                                    <Text style={styles.barLabel}>{rating}</Text>
                                    <View style={styles.barBackground}>
                                        <View
                                            style={[
                                                styles.barFill,
                                                { width: `${percentage}%` }
                                            ]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Reviews List */}
                    <FlatList
                        data={reviews}
                        keyExtractor={(item) => item.id}
                        renderItem={renderReviewItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubble-outline" size={48} color={COLORS.gray300} />
                                <Text style={styles.emptyText}>Aún no hay reseñas</Text>
                                <Text style={styles.emptySubtext}>
                                    Sé el primero en compartir tu experiencia
                                </Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: SCREEN_HEIGHT * 0.85,
        paddingTop: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.gray800,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    ratingSummary: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    ratingMain: {
        alignItems: 'center',
        paddingRight: 24,
        borderRightWidth: 1,
        borderRightColor: COLORS.gray100,
    },
    ratingBig: {
        fontSize: 42,
        fontWeight: '700',
        color: COLORS.gray800,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 4,
    },
    totalText: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 4,
    },
    ratingBars: {
        flex: 1,
        paddingLeft: 20,
        justifyContent: 'center',
        gap: 6,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    barLabel: {
        fontSize: 12,
        color: COLORS.gray500,
        width: 12,
    },
    barBackground: {
        flex: 1,
        height: 8,
        backgroundColor: COLORS.gray100,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: COLORS.warning,
        borderRadius: 4,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    reviewCard: {
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewerName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.gray800,
    },
    reviewDate: {
        fontSize: 12,
        color: COLORS.gray400,
        marginTop: 2,
    },
    reviewRating: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        fontSize: 14,
        color: COLORS.gray600,
        lineHeight: 21,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.gray500,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.gray400,
        marginTop: 4,
    },
});

export default ReviewsModal;
