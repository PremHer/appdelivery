import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, SHADOWS } from '../../constants';
import { useAuthStore, useLocationStore } from '../../context/stores';
import addressService from '../../services/address.service';
import type { Address } from '../../types';
import Button from '../../components/ui/Button';

interface AddressListScreenProps {
    navigation: any;
    route: any; // Para soportar modo 'selección' si venimos del checkout
}

const AddressListScreen: React.FC<AddressListScreenProps> = ({ navigation, route }) => {
    const { user } = useAuthStore();
    const { currentAddress, setCurrentAddress } = useLocationStore();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAddresses = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await addressService.getAddresses(user.id);
            setAddresses(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudieron cargar las direcciones');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadAddresses();
        }, [user])
    );

    const handleSelectAddress = (address: Address) => {
        setCurrentAddress(address);
        navigation.goBack();
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Eliminar dirección',
            '¿Estás seguro que deseas eliminar esta dirección?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await addressService.deleteAddress(id);
                            loadAddresses();
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar la dirección');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: Address }) => {
        const isSelected = currentAddress?.id === item.id;

        return (
            <TouchableOpacity
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelectAddress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <Ionicons
                        name={item.label.toLowerCase().includes('casa') ? 'home' : 'business'}
                        size={24}
                        color={isSelected ? COLORS.white : COLORS.primary}
                    />
                </View>
                <View style={styles.infoContainer}>
                    <Text style={[styles.label, isSelected && styles.labelSelected]}>
                        {item.label}
                        {item.is_default && <Text style={styles.defaultBadge}> (Predeterminada)</Text>}
                    </Text>
                    <Text style={styles.address}>{item.address}</Text>
                    {item.details && <Text style={styles.details}>{item.details}</Text>}
                </View>
                {isSelected && (
                    <View style={styles.checkIcon}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    </View>
                )}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
                <Text style={styles.title}>Mis Direcciones</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : addresses.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="location-outline" size={64} color={COLORS.gray300} />
                    <Text style={styles.emptyText}>No tienes direcciones guardadas</Text>
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            )}

            <View style={styles.footer}>
                <Button
                    title="Agregar Nueva Dirección"
                    onPress={() => navigation.navigate('AddAddress')}
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.xl,
    },
    emptyText: {
        marginTop: SIZES.md,
        color: COLORS.gray500,
        fontSize: SIZES.fontMd,
    },
    list: {
        padding: SIZES.lg,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: SIZES.md,
        borderRadius: SIZES.radiusMd,
        marginBottom: SIZES.md,
        alignItems: 'center',
        ...SHADOWS.small,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.md,
    },
    infoContainer: {
        flex: 1,
    },
    label: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
        marginBottom: 4,
    },
    defaultBadge: {
        fontSize: SIZES.fontSm,
        color: COLORS.primary,
        fontWeight: 'normal',
    },
    address: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
        marginBottom: 2,
    },
    details: {
        fontSize: SIZES.fontXs,
        color: COLORS.gray500,
        fontStyle: 'italic',
    },
    deleteButton: {
        padding: 8,
    },
    footer: {
        padding: SIZES.lg,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
    },
    cardSelected: {
        borderColor: COLORS.primary,
        borderWidth: 1,
        backgroundColor: COLORS.gray50,
    },
    iconContainerSelected: {
        backgroundColor: COLORS.primary,
    },
    labelSelected: {
        color: COLORS.primary,
    },
    checkIcon: {
        marginLeft: SIZES.sm,
    },
});

export default AddressListScreen;
