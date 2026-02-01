import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { COLORS, SIZES, FONTS } from '../../constants';
import { useAuthStore } from '../../context/stores';
import addressService from '../../services/address.service';
import Button from '../../components/ui/Button';

interface AddAddressScreenProps {
    navigation: any;
}

const AddAddressScreen: React.FC<AddAddressScreenProps> = ({ navigation }) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);

    const [label, setLabel] = useState('Casa');
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [details, setDetails] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    const getCurrentLocation = async () => {
        setDetecting(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Permite el acceso a la ubicación para detectar tu dirección.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setCoords({
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            });

            // Reverse Geocoding
            let addressResponse = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (addressResponse.length > 0) {
                const addr = addressResponse[0];
                const fullAddress = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}`.trim();
                setAddress(fullAddress || 'Ubicación detectada');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo detectar la ubicación.');
        } finally {
            setDetecting(false);
        }
    };

    const handleSave = async () => {
        if (!address || !coords) {
            Alert.alert('Error', 'Por favor ingresa una dirección o detecta tu ubicación.');
            return;
        }

        if (!user) return;

        setLoading(true);
        try {
            await addressService.addAddress({
                user_id: user.id,
                label,
                address,
                latitude: coords.lat,
                longitude: coords.lng,
                details,
                is_default: isDefault,
            });
            Alert.alert('Éxito', 'Dirección guardada correctamente.');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo guardar la dirección.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Nueva Dirección</Text>
                        <Ionicons
                            name="close"
                            size={24}
                            color={COLORS.gray900}
                            onPress={() => navigation.goBack()}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Etiqueta (Ej: Casa, Trabajo)</Text>
                        <View style={styles.labelSelector}>
                            {['Casa', 'Trabajo', 'Otro'].map((l) => (
                                <Button
                                    key={l}
                                    title={l}
                                    variant={label === l ? 'primary' : 'outline'}
                                    onPress={() => setLabel(l)}
                                    style={styles.labelButton}
                                    textStyle={{ fontSize: 12 }}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Dirección</Text>
                        <View style={styles.addressInputContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Calle, Número, Ciudad"
                            />
                            <Button
                                title=""
                                icon={<Ionicons name="navigate" size={20} color={COLORS.white} />}
                                onPress={getCurrentLocation}
                                loading={detecting}
                                style={styles.locationButton}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Referencias / Detalles</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={details}
                            onChangeText={setDetails}
                            placeholder="Apt, Piso, Referencia..."
                            multiline
                        />
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Establecer como predeterminada</Text>
                        <Switch
                            value={isDefault}
                            onValueChange={setIsDefault}
                            trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
                        />
                    </View>

                    <Button
                        title="Guardar Dirección"
                        onPress={handleSave}
                        loading={loading}
                        style={styles.saveButton}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        padding: SIZES.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.xl,
    },
    title: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    formGroup: {
        marginBottom: SIZES.lg,
    },
    label: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray900,
        marginBottom: SIZES.sm,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        fontSize: SIZES.fontMd,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    labelSelector: {
        flexDirection: 'row',
        gap: SIZES.sm,
    },
    labelButton: {
        minWidth: 80,
        height: 36,
    },
    addressInputContainer: {
        flexDirection: 'row',
        gap: SIZES.sm,
    },
    locationButton: {
        width: 50,
        paddingHorizontal: 0,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.xl,
        marginTop: SIZES.md,
    },
    saveButton: {
        marginTop: SIZES.lg,
    },
});

export default AddAddressScreen;
