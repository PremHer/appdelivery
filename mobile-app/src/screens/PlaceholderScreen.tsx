import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import Button from '../components/ui/Button';

interface PlaceholderScreenProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    message?: string;
    navigation?: any;
}

const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
    title,
    icon,
    message = "Estamos trabajando en esta funcionalidad.",
    navigation
}) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={64} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>

                {navigation && (
                    <Button
                        title="Volver al Inicio"
                        onPress={() => navigation.navigate('Home')}
                        style={styles.button}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.xl,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.lg,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: SIZES.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
        textAlign: 'center',
        marginBottom: SIZES.xxl,
        lineHeight: 24,
    },
    button: {
        minWidth: 200,
    }
});

export default PlaceholderScreen;
