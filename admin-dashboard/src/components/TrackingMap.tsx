import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon issue in Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Coords {
    lat: number;
    lng: number;
    label?: string;
}

interface TrackingMapProps {
    driver?: Coords;
    restaurant?: Coords;
    customer?: Coords;
}

// Component to auto-fit bounds
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds]);
    return null;
}

const TrackingMap: React.FC<TrackingMapProps> = ({ driver, restaurant, customer }) => {
    const [bounds, setBounds] = useState<L.LatLngBoundsExpression | null>(null);

    useEffect(() => {
        const points: L.LatLngExpression[] = [];
        if (driver) points.push([driver.lat, driver.lng]);
        if (restaurant) points.push([restaurant.lat, restaurant.lng]);
        if (customer) points.push([customer.lat, customer.lng]);

        if (points.length > 0) {
            setBounds(L.latLngBounds(points));
        }
    }, [driver, restaurant, customer]);

    // Default center (Lima, Peru or dynamic)
    const center: L.LatLngExpression = restaurant ? [restaurant.lat, restaurant.lng] : [-12.0464, -77.0428];

    return (
        <MapContainer center={center} zoom={13} style={{ height: '400px', width: '100%', borderRadius: '12px' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {restaurant && (
                <Marker position={[restaurant.lat, restaurant.lng]}>
                    <Popup>🏭 Restaurante: {restaurant.label}</Popup>
                </Marker>
            )}

            {customer && (
                <Marker position={[customer.lat, customer.lng]}>
                    <Popup>🏠 Cliente: {customer.label}</Popup>
                </Marker>
            )}

            {driver && (
                <Marker position={[driver.lat, driver.lng]} icon={L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png', // Motorbike Icon
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                })}>
                    <Popup>🛵 Repartidor: {driver.label}</Popup>
                </Marker>
            )}

            {bounds && <ChangeView bounds={bounds} />}
        </MapContainer>
    );
};

export default TrackingMap;
