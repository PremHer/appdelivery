import React, { useState } from 'react';
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
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { COLORS, SIZES } from '../../constants';
import { useAuthStore } from '../../context/stores';
import addressService from '../../services/address.service';
import Button from '../../components/ui/Button';
import MapPickerModal from '../../components/modals/MapPickerModal';

interface AddAddressScreenProps {
    navigation: any;
}

const LABELS = [
    { id: 'Casa', icon: 'home', color: '#4CAF50' },
    { id: 'Trabajo', icon: 'briefcase', color: '#2196F3' },
    { id: 'Otro', icon: 'location', color: '#FF9800' },
];

const AddAddressScreen: React.FC<AddAddressScreenProps> = ({ navigation }) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

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

    const handleMapSelection = (location: { address: string; latitude: number; longitude: number }) => {
        setAddress(location.address);
        setCoords({ lat: location.latitude, lng: location.longitude });
    };

    const handleSave = async () => {
        if (!address || !coords) {
            Alert.alert('Error', 'Por favor selecciona una ubicación en el mapa o detecta tu ubicación.');
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
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Nueva Dirección</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Label Selector - Improved */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tipo de dirección</Text>
                        <View style={styles.labelSelector}>
                            {LABELS.map((l) => {
                                const isSelected = label === l.id;
                                return (
                                    <TouchableOpacity
                                        key={l.id}
                                        style={[
                                            styles.labelCard,
                                            isSelected && { borderColor: l.color, backgroundColor: l.color + '15' },
                                        ]}
                                        onPress={() => setLabel(l.id)}
                                    >
                                        <View style={[styles.labelIconContainer, { backgroundColor: l.color + '20' }]}>
                                            <Ionicons name={l.icon as any} size={20} color={l.color} />
                                        </View>
                                        <Text style={[styles.labelText, isSelected && { color: l.color, fontWeight: '700' }]}>
                                            {l.id}
                                        </Text>
                                        {isSelected && (
                                            <View style={[styles.checkMark, { backgroundColor: l.color }]}>
                                                <Ionicons name="checkmark" size={12} color={COLORS.white} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Address Input with Map Button */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Dirección</Text>
                        <TouchableOpacity
                            style={styles.addressCard}
                            onPress={() => setShowMapPicker(true)}
                        >
                            <View style={styles.addressContent}>
                                <Ionicons name="location" size={22} color={COLORS.primary} />
                                <Text style={[styles.addressText, !address && styles.addressPlaceholder]}>
                                    {address || 'Toca para seleccionar en el mapa'}
                                </Text>
                            </View>
                            <Ionicons name="map" size={22} color={COLORS.primary} />
                        </TouchableOpacity>

                        {/* Quick GPS Button */}
                        <TouchableOpacity
                            style={styles.gpsButton}
                            onPress={getCurrentLocation}
                            disabled={detecting}
                        >
                            <Ionicons
                                name="navigate"
                                size={18}
                                color={COLORS.primary}
                            />
                            <Text style={styles.gpsButtonText}>
                                {detecting ? 'Detectando...' : 'Usar mi ubicación actual'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Coordinates Preview */}
                    {coords && (
                        <View style={styles.coordsPreview}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                            <Text style={styles.coordsText}>
                                Ubicación guardada: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                            </Text>
                        </View>
                    )}

                    {/* Details */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Referencias / Detalles</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={details}
                            onChangeText={setDetails}
                            placeholder="Ej: Puerta blanca, segundo piso, cerca al parque..."
                            placeholderTextColor={COLORS.gray400}
                            multiline
                        />
                    </View>

                    {/* Default Switch */}
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="star" size={20} color={COLORS.warning} />
                            <Text style={styles.rowLabel}>Establecer como predeterminada</Text>
                        </View>
                        <Switch
                            value={isDefault}
                            onValueChange={setIsDefault}
                            trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
                            thumbColor={isDefault ? COLORS.white : COLORS.gray400}
                        />
                    </View>

                    {/* Save Button */}
                    <Button
                        title="Guardar Dirección"
                        onPress={handleSave}
                        loading={loading}
                        style={styles.saveButton}
                        icon={<Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Map Picker Modal */}
            <MapPickerModal
                visible={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onSelectLocation={handleMapSelection}
                initialLocation={coords ? { latitude: coords.lat, longitude: coords.lng } : undefined}
            />
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
    labelSelector: {
        flexDirection: 'row',
        gap: SIZES.sm,
    },
    labelCard: {
        flex: 1,
        padding: SIZES.md,
        borderRadius: SIZES.radiusMd,
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.gray200,
        alignItems: 'center',
        position: 'relative',
    },
    labelIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    labelText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray600,
        fontWeight: '500',
    },
    checkMark: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: SIZES.md,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    addressContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: SIZES.sm,
    },
    addressText: {
        flex: 1,
        fontSize: SIZES.fontMd,
        color: COLORS.gray900,
    },
    addressPlaceholder: {
        color: COLORS.gray400,
    },
    gpsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: SIZES.sm,
        paddingVertical: SIZES.sm,
    },
    gpsButtonText: {
        fontSize: SIZES.fontSm,
        color: COLORS.primary,
        fontWeight: '600',
    },
    coordsPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.success + '15',
        padding: SIZES.sm,
        borderRadius: SIZES.radiusSm,
        marginBottom: SIZES.md,
    },
    coordsText: {
        fontSize: 11,
        color: COLORS.success,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        fontSize: SIZES.fontMd,
        color: COLORS.gray900,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: SIZES.md,
        borderRadius: SIZES.radiusMd,
        marginBottom: SIZES.xl,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIZES.sm,
    },
    rowLabel: {
        fontSize: SIZES.fontMd,
        color: COLORS.gray800,
        fontWeight: '500',
    },
    saveButton: {
        marginTop: SIZES.md,
    },
});

export default AddAddressScreen;
