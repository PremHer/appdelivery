import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants';
import { MapPin, Phone, CheckCircle, Navigation, MessageCircle, Camera, Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

export default function OrderDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { orderId } = route.params as { orderId: string };
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    proof_of_delivery,
                    restaurant:restaurants(name, address, phone, latitude, longitude),
                    user:users!user_id(full_name, phone),
                    items:order_items(
                        quantity,
                        unit_price,
                        notes,
                        customizations,
                        product:products(name)
                    )
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            Alert.alert('Error', 'No se pudo cargar el pedido');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            let proofUrl = null;

            if (newStatus === 'delivered' && deliveryPhoto) {
                setUploading(true);
                try {
                    const response = await fetch(deliveryPhoto);
                    const blob = await response.blob();
                    const fileName = `${orderId}_${Date.now()}.jpg`;

                    const { data, error: uploadError } = await supabase.storage
                        .from('delivery-proofs')
                        .upload(fileName, blob);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('delivery-proofs')
                        .getPublicUrl(fileName);

                    proofUrl = publicUrl;
                } catch (err) {
                    console.error('Error uploading photo:', err);
                    Alert.alert('Error', 'No se pudo subir la foto. ¿Continuar sin ella?', [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Continuar',
                            onPress: () => finishUpdate(newStatus, null)
                        }
                    ]);
                    setUploading(false);
                    return;
                }
            }

            await finishUpdate(newStatus, proofUrl);
        } catch (error) {
            console.error('Error in update flow:', error);
            setUploading(false);
        }
    };

    const finishUpdate = async (newStatus: string, proofUrl: string | null) => {
        try {
            const updates: any = { status: newStatus };
            if (proofUrl) updates.proof_of_delivery = proofUrl;

            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            if (error) throw error;

            // Send push notification to customer
            try {
                const restaurantName = order?.restaurant?.name || 'Restaurante';
                await fetch('https://backend-production-7bd6.up.railway.app/api/v1/notifications/order-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId,
                        status: newStatus,
                        restaurantName,
                    }),
                });
            } catch (notifError) {
                console.warn('Notification error (non-blocking):', notifError);
            }

            Alert.alert('Éxito', `Estado actualizado a: ${newStatus === 'picked_up' ? 'En Camino' : 'Entregado'}`);
            fetchOrderDetails();
            if (newStatus === 'delivered') {
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Error', 'No tienes permiso para actualizar este pedido o ocurrió un error.');
        } finally {
            setUploading(false);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar la foto de entrega.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setDeliveryPhoto(result.assets[0].uri);
        }
    };

    const openMaps = (lat: number, lon: number, label: string) => {
        Alert.alert(
            'Navegar con...',
            'Elige tu aplicación de mapas preferida',
            [
                {
                    text: 'Waze',
                    onPress: () => {
                        const url = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
                        Linking.openURL(url).catch(() =>
                            Alert.alert('Error', 'No se pudo abrir Waze. Asegúrate de tenerla instalada.')
                        );
                    }
                },
                {
                    text: 'Google Maps',
                    onPress: () => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
                        Linking.openURL(url);
                    }
                },
                {
                    text: 'Cancelar',
                    style: 'cancel'
                }
            ]
        );
    };

    if (loading) return <View style={styles.center}><Text>Cargando details...</Text></View>;
    if (!order) return <View style={styles.center}><Text>Pedido no encontrado</Text></View>;

    const getActionRef = () => {
        // confirmed or preparing -> pick up the order
        if (order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready') {
            return { label: 'MARCAR EN CAMINO', action: () => updateStatus('picked_up'), color: COLORS.primary };
        }
        // picked_up -> deliver
        if (order.status === 'picked_up') {
            return { label: 'FINALIZAR ENTREGA', action: () => updateStatus('delivered'), color: COLORS.success };
        }
        return null;
    };

    const action = getActionRef();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.title}>Pedido #{order.id.slice(0, 8)}</Text>
                <View style={[styles.badge, { backgroundColor: COLORS.gray200 }]}>
                    <Text style={styles.badgeText}>{order.status.toUpperCase()}</Text>
                </View>
            </View>

            {/* Restaurant */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Restaurante</Text>
                <Text style={styles.name}>{order.restaurant?.name}</Text>
                <TouchableOpacity onPress={() => openMaps(order.restaurant.latitude, order.restaurant.longitude, 'Restaurante')} style={styles.row}>
                    <MapPin size={18} color={COLORS.primary} />
                    <Text style={styles.link}>{order.restaurant?.address}</Text>
                </TouchableOpacity>
            </View>

            {/* Customer */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Cliente</Text>
                <Text style={styles.name}>{order.user?.full_name}</Text>
                <TouchableOpacity onPress={() => openMaps(order.delivery_latitude, order.delivery_longitude, 'Cliente')} style={styles.row}>
                    <Navigation size={18} color={COLORS.secondary} />
                    <Text style={styles.link}>{order.delivery_address}</Text>
                </TouchableOpacity>
                <View style={styles.contactRow}>
                    <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${order.user?.phone}`)}
                        style={styles.contactButton}
                    >
                        <Phone size={18} color={COLORS.white} />
                        <Text style={styles.contactButtonText}>Llamar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => (navigation as any).navigate('Chat', {
                            orderId: order.id,
                            customerName: order.user?.full_name,
                        })}
                        style={[styles.contactButton, { backgroundColor: COLORS.primary }]}
                    >
                        <MessageCircle size={18} color={COLORS.white} />
                        <Text style={styles.contactButtonText}>Chat</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Items */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Items</Text>
                {order.items?.map((item: any, index: number) => (
                    <View key={index} style={styles.itemContainer}>
                        <View style={styles.itemRow}>
                            <Text style={styles.qty}>{item.quantity}x</Text>
                            <Text style={styles.itemName}>{item.product?.name}</Text>
                            <Text style={styles.itemPrice}>S/ {(item.unit_price * item.quantity).toFixed(2)}</Text>
                        </View>

                        {/* Options/Addons */}
                        {item.customizations && Array.isArray(item.customizations) && item.customizations.map((opt: any, i: number) => (
                            <Text key={i} style={styles.optionText}>
                                • {opt.name} {opt.price > 0 && `(+S/ ${Number(opt.price).toFixed(2)})`}
                            </Text>
                        ))}

                        {/* Notes */}
                        {item.notes && (
                            <Text style={styles.notesText}>📝 Note: {item.notes}</Text>
                        )}
                    </View>
                ))}
            </View>

            {/* Ver en Mapa Button */}
            <TouchableOpacity
                style={[styles.button, { backgroundColor: COLORS.secondary }]}
                onPress={() => (navigation as any).navigate('DeliveryMap', {
                    restaurantName: order.restaurant?.name,
                    restaurantLat: order.restaurant?.latitude,
                    restaurantLng: order.restaurant?.longitude,
                    customerName: order.user?.full_name,
                    customerLat: order.delivery_latitude,
                    customerLng: order.delivery_longitude,
                    customerPhone: order.user?.phone,
                    orderStatus: order.status
                })}
            >
                <Text style={styles.buttonText}>🗺️ VER EN MAPA</Text>
            </TouchableOpacity>

            {/* Action Button */}

            {/* Delivery Photo (Only when picked_up) */}
            {order.status === 'picked_up' && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Foto de Entrega (Opcional)</Text>
                    {deliveryPhoto ? (
                        <View>
                            <Image source={{ uri: deliveryPhoto }} style={styles.previewImage} />
                            <TouchableOpacity onPress={() => setDeliveryPhoto(null)} style={styles.retakeButton}>
                                <Text style={styles.retakeText}>Tomar otra foto</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                            <Camera size={24} color={COLORS.gray600} />
                            <Text style={styles.cameraText}>Tomar Foto</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* View Proof (When delivered) */}
            {order.status === 'delivered' && order.proof_of_delivery && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Prueba de Entrega</Text>
                    <Image source={{ uri: order.proof_of_delivery }} style={styles.previewImage} resizeMode="cover" />
                </View>
            )}

            {action && (
                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: action.color },
                        uploading && { opacity: 0.7 }
                    ]}
                    onPress={action.action || undefined}
                    disabled={!action.action || uploading}
                >
                    <Text style={styles.buttonText}>
                        {uploading ? 'SUBIENDO FOTO...' : action.label}
                    </Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.gray50, padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    section: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold' },
    badge: { alignSelf: 'flex-start', padding: 4, borderRadius: 4, marginTop: 8 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 14, color: COLORS.gray500, marginBottom: 8, textTransform: 'uppercase' },
    name: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    link: { color: COLORS.primary, textDecorationLine: 'underline' },
    contactRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.success,
        paddingVertical: 10,
        borderRadius: 8
    },
    contactButtonText: { color: COLORS.white, fontWeight: '600' },
    itemContainer: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, paddingBottom: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
    qty: { fontWeight: 'bold', fontSize: 16, color: COLORS.primary },
    itemName: { flex: 1, fontSize: 16, fontWeight: '500' },
    itemPrice: { fontWeight: 'bold', color: COLORS.gray800 },
    optionText: { fontSize: 14, color: COLORS.gray600, marginLeft: 28, marginBottom: 2 },
    notesText: { fontSize: 14, color: COLORS.gray500, fontStyle: 'italic', marginLeft: 28, marginTop: 4 },
    button: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    cameraButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray300,
        borderStyle: 'dashed',
    },
    cameraText: { color: COLORS.gray600, fontWeight: '600' },
    previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
    retakeButton: { alignItems: 'center', padding: 8 },
    retakeText: { color: COLORS.error, fontWeight: '600' },
});
