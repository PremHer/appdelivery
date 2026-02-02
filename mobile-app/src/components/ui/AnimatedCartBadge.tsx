import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

interface AnimatedCartBadgeProps {
    count: number;
    onPress: () => void;
    color?: string;
}

const AnimatedCartBadge: React.FC<AnimatedCartBadgeProps> = ({
    count,
    onPress,
    color = COLORS.gray700,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const prevCountRef = useRef(count);

    useEffect(() => {
        // Only animate if count increased
        if (count > prevCountRef.current) {
            // Bounce animation for badge
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.4,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Shake animation for cart icon
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: -5,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 5,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: -3,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 50,
                    useNativeDriver: true,
                }),
            ]).start();
        }
        prevCountRef.current = count;
    }, [count]);

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ translateX: bounceAnim }] }}>
                <Ionicons name="cart-outline" size={26} color={color} />
            </Animated.View>
            {count > 0 && (
                <Animated.View
                    style={[
                        styles.badge,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <Text style={styles.badgeText}>
                        {count > 99 ? '99+' : count}
                    </Text>
                </Animated.View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: COLORS.accent,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '700',
    },
});

export default AnimatedCartBadge;
