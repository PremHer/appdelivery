import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, SHADOWS } from '../../constants';
import { useAuthStore } from '../../context/stores';
import Button from '../../components/ui/Button';

const ProfileScreen = ({ navigation }: { navigation: any }) => {
    const { user, logout } = useAuthStore();

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <Ionicons name="person-circle-outline" size={80} color={COLORS.gray400} />
                    <Text style={styles.loginTitle}>No has iniciado sesión</Text>
                    <Text style={styles.loginText}>Ingresa para ver tu perfil y pedidos</Text>
                    <Button
                        title="Iniciar Sesión"
                        onPress={() => navigation.navigate('Login')}
                        style={{ marginTop: 20 }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={styles.name}>{user.full_name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mi Cuenta</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Ionicons name="person-outline" size={24} color={COLORS.gray700} />
                        <Text style={styles.menuText}>Datos Personales</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('AddressList')}
                    >
                        <Ionicons name="location-outline" size={24} color={COLORS.gray700} />
                        <Text style={styles.menuText}>Direcciones</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('PaymentMethods')}
                    >
                        <Ionicons name="card-outline" size={24} color={COLORS.gray700} />
                        <Text style={styles.menuText}>Métodos de Pago</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>

                <Button
                    title="Cerrar Sesión"
                    onPress={logout}
                    variant="outline"
                    style={styles.logoutButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.xl,
    },
    loginTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        marginTop: SIZES.lg,
        marginBottom: SIZES.xs,
    },
    loginText: {
        color: COLORS.gray500,
        marginBottom: SIZES.xl,
    },
    content: {
        padding: SIZES.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: SIZES.xxl,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.md,
        ...SHADOWS.medium,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '700',
        color: COLORS.white,
    },
    name: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: 4,
    },
    email: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray500,
    },
    section: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        marginBottom: SIZES.xl,
        ...SHADOWS.small,
    },
    sectionTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: SIZES.md,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SIZES.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    menuText: {
        flex: 1,
        marginLeft: SIZES.md,
        fontSize: SIZES.fontMd,
        color: COLORS.gray800,
    },
    logoutButton: {
        marginTop: SIZES.md,
        borderColor: COLORS.error,
    }
});

export default ProfileScreen;
