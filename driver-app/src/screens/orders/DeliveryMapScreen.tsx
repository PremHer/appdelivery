import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Navigation, MapPin, Phone } from 'lucide-react-native';
import { COLORS } from '../../constants';

interface DeliveryMapScreenProps {
    route: {
        params: {
            restaurantName: string;
            restaurantLat: number;
            restaurantLng: number;
            customerName: string;
            customerLat: number;
            customerLng: number;
            customerPhone?: string;
            orderStatus: string;
        };
    };
    navigation: any;
}

export default function DeliveryMapScreen({ route, navigation }: DeliveryMapScreenProps) {
    const {
        restaurantName, restaurantLat, restaurantLng,
        customerName, customerLat, customerLng, customerPhone,
        orderStatus
    } = route.params;

    const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'No podemos acceder a tu ubicación');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setDriverLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        })();
    }, []);

    useEffect(() => {
        // Fit map to show all markers
        if (mapRef.current && driverLocation) {
            const coords = [
                driverLocation,
                { latitude: restaurantLat, longitude: restaurantLng },
                { latitude: customerLat, longitude: customerLng }
            ];
            mapRef.current.fitToCoordinates(coords, {
                edgePadding: { top: 80, right: 50, bottom: 150, left: 50 },
                animated: true
            });
        }
    }, [driverLocation]);

    const openNavigation = (lat: number, lng: number, label: string) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    const callCustomer = () => {
        if (customerPhone) {
            Linking.openURL(`tel:${customerPhone}`);
        }
    };

    // Determine next destination based on order status
    const nextDestination = orderStatus === 'picked_up'
        ? { lat: customerLat, lng: customerLng, name: customerName, label: 'Cliente' }
        : { lat: restaurantLat, lng: restaurantLng, name: restaurantName, label: 'Restaurante' };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                showsUserLocation
                showsMyLocationButton
                initialRegion={{
                    latitude: restaurantLat,
                    longitude: restaurantLng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05
                }}
            >
                {/* Restaurant Marker */}
                <Marker
                    coordinate={{ latitude: restaurantLat, longitude: restaurantLng }}
                    title={restaurantName}
                    description="Recoger pedido aquí"
                    pinColor="orange"
                />

                {/* Customer Marker */}
                <Marker
                    coordinate={{ latitude: customerLat, longitude: customerLng }}
                    title={customerName}
                    description="Entregar aquí"
                    pinColor="green"
                />

                {/* Route Line */}
                {driverLocation && (
                    <Polyline
                        coordinates={[
                            driverLocation,
                            { latitude: restaurantLat, longitude: restaurantLng },
                            { latitude: customerLat, longitude: customerLng }
                        ]}
                        strokeColor={COLORS.primary}
                        strokeWidth={4}
                        lineDashPattern={[1]}
                    />
                )}
            </MapView>

            {/* Bottom Action Card */}
            <View style={styles.actionCard}>
                <View style={styles.destinationInfo}>
                    <Text style={styles.destinationLabel}>
                        {orderStatus === 'picked_up' ? '📍 Entregar a:' : '🏭 Recoger en:'}
                    </Text>
                    <Text style={styles.destinationName}>{nextDestination.name}</Text>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.navButton]}
                        onPress={() => openNavigation(nextDestination.lat, nextDestination.lng, nextDestination.label)}
                    >
                        <Navigation size={24} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Navegar</Text>
                    </TouchableOpacity>

                    {orderStatus === 'picked_up' && customerPhone && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.callButton]}
                            onPress={callCustomer}
                        >
                            <Phone size={24} color={COLORS.white} />
                            <Text style={styles.actionButtonText}>Llamar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    map: {
        flex: 1
    },
    actionCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10
    },
    destinationInfo: {
        marginBottom: 16
    },
    destinationLabel: {
        fontSize: 14,
        color: COLORS.gray500,
        marginBottom: 4
    },
    destinationName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12
    },
    navButton: {
        backgroundColor: COLORS.primary
    },
    callButton: {
        backgroundColor: COLORS.success
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold'
    }
});
