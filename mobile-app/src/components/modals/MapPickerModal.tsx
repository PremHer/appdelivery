import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Google Places API Key - should be in env
const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';

interface MapPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: {
        address: string;
        latitude: number;
        longitude: number;
    }) => void;
    initialLocation?: { latitude: number; longitude: number };
}

interface PlacePrediction {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({
    visible,
    onClose,
    onSelectLocation,
    initialLocation,
}) => {
    const mapRef = useRef<MapView>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{
        latitude: number;
        longitude: number;
        address: string;
    } | null>(null);
    const [region, setRegion] = useState({
        latitude: initialLocation?.latitude || -12.0464,
        longitude: initialLocation?.longitude || -77.0428,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && !initialLocation) {
            getCurrentLocation();
        }
    }, [visible]);

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            setRegion(newRegion);
            handleMapPress({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        } catch (error) {
            console.error('Error getting location:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMapPress = async (coords: { latitude: number; longitude: number }) => {
        setLoading(true);
        try {
            const addresses = await Location.reverseGeocodeAsync(coords);
            if (addresses.length > 0) {
                const addr = addresses[0];
                const fullAddress = [
                    addr.street,
                    addr.streetNumber,
                    addr.district,
                    addr.city,
                ].filter(Boolean).join(', ');

                setSelectedLocation({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    address: fullAddress || 'Ubicación seleccionada',
                });
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            setSelectedLocation({
                latitude: coords.latitude,
                longitude: coords.longitude,
                address: 'Ubicación seleccionada',
            });
        } finally {
            setLoading(false);
        }
    };

    const searchPlaces = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setPredictions([]);
            return;
        }

        setSearching(true);
        try {
            // Use Expo Location geocoding as fallback
            const results = await Location.geocodeAsync(query);
            if (results.length > 0) {
                // Create simple predictions from geocode results
                const simplePredictions: PlacePrediction[] = [{
                    place_id: '1',
                    description: query,
                    structured_formatting: {
                        main_text: query,
                        secondary_text: 'Geocodificado',
                    },
                }];
                setPredictions(simplePredictions);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectPrediction = async (prediction: PlacePrediction) => {
        setSearching(true);
        try {
            const results = await Location.geocodeAsync(prediction.description);
            if (results.length > 0) {
                const { latitude, longitude } = results[0];
                const newRegion = {
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };
                setRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 500);
                handleMapPress({ latitude, longitude });
                setSearchQuery(prediction.description);
                setPredictions([]);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleConfirm = () => {
        if (selectedLocation) {
            onSelectLocation(selectedLocation);
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={COLORS.gray800} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Seleccionar Ubicación</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.gray400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar dirección..."
                        value={searchQuery}
                        onChangeText={searchPlaces}
                        placeholderTextColor={COLORS.gray400}
                    />
                    {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
                </View>

                {/* Predictions List */}
                {predictions.length > 0 && (
                    <View style={styles.predictionsContainer}>
                        <FlatList
                            data={predictions}
                            keyExtractor={(item) => item.place_id}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.predictionItem}
                                    onPress={() => handleSelectPrediction(item)}
                                >
                                    <Ionicons name="location" size={18} color={COLORS.primary} />
                                    <View style={styles.predictionText}>
                                        <Text style={styles.predictionMain}>
                                            {item.structured_formatting.main_text}
                                        </Text>
                                        <Text style={styles.predictionSecondary}>
                                            {item.structured_formatting.secondary_text}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Map */}
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        region={region}
                        onRegionChangeComplete={setRegion}
                        onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
                        showsUserLocation
                        showsMyLocationButton={false}
                    >
                        {selectedLocation && (
                            <Marker
                                coordinate={{
                                    latitude: selectedLocation.latitude,
                                    longitude: selectedLocation.longitude,
                                }}
                            >
                                <View style={styles.customMarker}>
                                    <Ionicons name="location" size={32} color={COLORS.primary} />
                                </View>
                            </Marker>
                        )}
                    </MapView>

                    {/* Center pin indicator */}
                    {!selectedLocation && (
                        <View style={styles.centerPin}>
                            <Ionicons name="location" size={40} color={COLORS.primary} />
                        </View>
                    )}

                    {/* My Location Button */}
                    <TouchableOpacity
                        style={styles.myLocationButton}
                        onPress={getCurrentLocation}
                    >
                        <Ionicons name="locate" size={24} color={COLORS.primary} />
                    </TouchableOpacity>

                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    )}
                </View>

                {/* Selected Address Info */}
                <View style={styles.footer}>
                    <View style={styles.addressPreview}>
                        <Ionicons name="location" size={24} color={COLORS.primary} />
                        <Text style={styles.addressText} numberOfLines={2}>
                            {selectedLocation?.address || 'Toca en el mapa para seleccionar ubicación'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            !selectedLocation && styles.confirmButtonDisabled,
                        ]}
                        onPress={handleConfirm}
                        disabled={!selectedLocation}
                    >
                        <Text style={styles.confirmButtonText}>Confirmar Ubicación</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.md,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: SIZES.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray200,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        marginHorizontal: SIZES.md,
        marginVertical: SIZES.sm,
        paddingHorizontal: SIZES.md,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    searchInput: {
        flex: 1,
        paddingVertical: SIZES.md,
        paddingHorizontal: SIZES.sm,
        fontSize: SIZES.fontMd,
        color: COLORS.gray900,
    },
    predictionsContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 140 : 110,
        left: SIZES.md,
        right: SIZES.md,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        maxHeight: 200,
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    predictionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    predictionText: {
        marginLeft: SIZES.sm,
        flex: 1,
    },
    predictionMain: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray900,
    },
    predictionSecondary: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    centerPin: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -40,
    },
    customMarker: {
        alignItems: 'center',
    },
    myLocationButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 50,
        height: 50,
        backgroundColor: COLORS.white,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        backgroundColor: COLORS.white,
        padding: SIZES.md,
        paddingBottom: Platform.OS === 'ios' ? 34 : SIZES.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
    },
    addressPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.md,
        gap: SIZES.sm,
    },
    addressText: {
        flex: 1,
        fontSize: SIZES.fontMd,
        color: COLORS.gray700,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SIZES.md,
        borderRadius: SIZES.radiusMd,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.gray300,
    },
    confirmButtonText: {
        color: COLORS.white,
        fontSize: SIZES.fontMd,
        fontWeight: '700',
    },
});

export default MapPickerModal;
