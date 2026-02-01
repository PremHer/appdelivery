import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES } from '../../constants';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
    navigation: any;
    onComplete?: () => void;
}

interface SlideData {
    id: string;
    title: string;
    highlight: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    backgroundColor: string;
    iconColor: string;
}

const slides: SlideData[] = [
    {
        id: '1',
        title: 'Descubre locales y pide',
        highlight: 'tus platos favoritos',
        subtitle: 'Restaurantes, cafeterías, postres y más cerca de ti',
        icon: 'restaurant',
        backgroundColor: '#E91E63',
        iconColor: '#fff',
    },
    {
        id: '2',
        title: 'Resuelve',
        highlight: 'tus compras del día',
        subtitle: 'Farmacias, bodegas, licorerías, mascotas y más',
        icon: 'cart',
        backgroundColor: '#9C27B0',
        iconColor: '#fff',
    },
    {
        id: '3',
        title: 'Sigue tu pedido',
        highlight: 'en tiempo real',
        subtitle: 'Mira dónde está tu pedido a cada momento',
        icon: 'location',
        backgroundColor: '#2196F3',
        iconColor: '#fff',
    },
    {
        id: '4',
        title: 'Paga como quieras',
        highlight: 'Yape, Plin, Efectivo',
        subtitle: 'Múltiples métodos de pago para tu comodidad',
        icon: 'wallet',
        backgroundColor: '#4CAF50',
        iconColor: '#fff',
    },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('onboarding_complete', 'true');
            // Call the onComplete callback to update navigation state
            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            console.error('Error saving onboarding status:', error);
            if (onComplete) {
                onComplete();
            }
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }).current;

    const renderSlide = ({ item }: { item: SlideData }) => (
        <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
            <View style={styles.slideContent}>
                <View style={styles.iconContainer}>
                    <Ionicons name={item.icon} size={120} color={item.iconColor} />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.highlight}>{item.highlight}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
        </View>
    );

    const renderPagination = () => (
        <View style={styles.paginationContainer}>
            {slides.map((_, index) => {
                const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Saltar</Text>
                </TouchableOpacity>
            </SafeAreaView>

            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            />

            <SafeAreaView style={styles.footer}>
                {renderPagination()}
                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.nextButtonText}>
                        {currentIndex === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
                    </Text>
                    <Ionicons
                        name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
                        size={20}
                        color="#fff"
                    />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    skipButton: {
        alignSelf: 'flex-end',
        padding: 10,
    },
    skipText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slideContent: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '300',
        color: '#fff',
        textAlign: 'center',
    },
    highlight: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
        marginHorizontal: 4,
    },
    nextButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default OnboardingScreen;
