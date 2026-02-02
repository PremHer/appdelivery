import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../context/stores';

const { width } = Dimensions.get('window');

interface WelcomeBannerProps {
    onApplyCoupon?: (code: string) => void;
    onDismiss?: () => void;
}

const WELCOME_COUPON_CODE = 'BIENVENIDO20';

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onApplyCoupon, onDismiss }) => {
    const [visible, setVisible] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const slideAnim = useState(new Animated.Value(-100))[0];
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        checkIfNewUser();
    }, [user]);

    const checkIfNewUser = async () => {
        if (!user) {
            setVisible(false);
            return;
        }

        try {
            // Check if user has any completed orders
            const { count, error } = await supabase
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .in('status', ['delivered', 'completed']);

            if (error) throw error;

            // User is new if they have no completed orders
            const isNew = (count || 0) === 0;
            setIsNewUser(isNew);

            if (isNew) {
                // Check if they've already dismissed this banner (stored locally)
                // For simplicity, we'll just show it if they're new
                setVisible(true);
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }).start();
            }
        } catch (error) {
            console.error('Error checking new user:', error);
        }
    };

    const handleApply = () => {
        onApplyCoupon?.(WELCOME_COUPON_CODE);
        handleDismiss();
    };

    const handleDismiss = () => {
        Animated.timing(slideAnim, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            onDismiss?.();
        });
    };

    if (!visible || !isNewUser) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            <LinearGradient
                colors={[COLORS.accent, '#00E676']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
                    <Ionicons name="close" size={20} color={COLORS.white} />
                </TouchableOpacity>

                <View style={styles.iconContainer}>
                    <Text style={styles.emoji}>🎉</Text>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>¡Bienvenido a Sajino Express!</Text>
                    <Text style={styles.subtitle}>
                        Usa el código <Text style={styles.code}>{WELCOME_COUPON_CODE}</Text> y obtén
                    </Text>
                    <Text style={styles.discount}>20% OFF</Text>
                    <Text style={styles.terms}>en tu primer pedido</Text>
                </View>

                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                    <Text style={styles.applyButtonText}>Aplicar Ahora</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
                </TouchableOpacity>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: SIZES.lg,
        marginBottom: SIZES.md,
        borderRadius: SIZES.radiusLg,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: {
        padding: SIZES.lg,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
        zIndex: 10,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    emoji: {
        fontSize: 40,
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: SIZES.fontSm,
        color: COLORS.white,
        opacity: 0.9,
    },
    code: {
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    discount: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.white,
        marginVertical: 8,
    },
    terms: {
        fontSize: SIZES.fontSm,
        color: COLORS.white,
        opacity: 0.8,
    },
    applyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: SIZES.radiusMd,
        marginTop: SIZES.md,
        gap: 8,
    },
    applyButtonText: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.accent,
    },
});

export default WelcomeBanner;
