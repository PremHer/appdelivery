import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Phone, Mail, Truck, LogOut, Edit2, Check, X, MapPin } from 'lucide-react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../services/supabase';

interface DriverProfile {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    vehicle_type: string | null;
    vehicle_plate: string | null;
    is_available: boolean;
}

export default function ProfileScreen({ navigation }: any) {
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [vehiclePlate, setVehiclePlate] = useState('');

    // Stats
    const [stats, setStats] = useState({
        totalDeliveries: 0,
        todayDeliveries: 0,
        totalEarnings: 0,
        todayEarnings: 0,
    });

    useEffect(() => {
        fetchProfile();
        fetchStats();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setProfile({
                ...data,
                email: user.email || '',
            });

            // Set editable fields
            setFullName(data.full_name || '');
            setPhone(data.phone || '');
            setVehicleType(data.vehicle_type || 'Moto');
            setVehiclePlate(data.vehicle_plate || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get today's date at midnight
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Total deliveries
            const { count: totalDeliveries } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('driver_id', user.id)
                .eq('status', 'delivered');

            // Today's deliveries
            const { count: todayDeliveries } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('driver_id', user.id)
                .eq('status', 'delivered')
                .gte('updated_at', today.toISOString());

            // Total earnings
            const { data: totalEarningsData } = await supabase
                .from('orders')
                .select('delivery_fee')
                .eq('driver_id', user.id)
                .eq('status', 'delivered');

            const totalEarnings = totalEarningsData?.reduce((sum, order) => sum + (order.delivery_fee || 0), 0) || 0;

            // Today earnings
            const { data: todayEarningsData } = await supabase
                .from('orders')
                .select('delivery_fee')
                .eq('driver_id', user.id)
                .eq('status', 'delivered')
                .gte('updated_at', today.toISOString());

            const todayEarnings = todayEarningsData?.reduce((sum, order) => sum + (order.delivery_fee || 0), 0) || 0;

            setStats({
                totalDeliveries: totalDeliveries || 0,
                todayDeliveries: todayDeliveries || 0,
                totalEarnings,
                todayEarnings,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleSave = async () => {
        if (!profile) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: fullName,
                    phone,
                    vehicle_type: vehicleType,
                    vehicle_plate: vehiclePlate,
                })
                .eq('id', profile.id);

            if (error) throw error;

            setProfile({
                ...profile,
                full_name: fullName,
                phone,
                vehicle_type: vehicleType,
                vehicle_plate: vehiclePlate,
            });
            setEditing(false);
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut();
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <User size={40} color={COLORS.white} />
                        </View>
                        <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, { backgroundColor: profile?.is_available ? COLORS.success : COLORS.gray400 }]} />
                        </View>
                    </View>
                    <Text style={styles.name}>{profile?.full_name || 'Repartidor'}</Text>
                    <Text style={styles.email}>{profile?.email}</Text>

                    {!editing && (
                        <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                            <Edit2 size={16} color={COLORS.primary} />
                            <Text style={styles.editButtonText}>Editar Perfil</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.todayDeliveries}</Text>
                        <Text style={styles.statLabel}>Entregas Hoy</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: COLORS.success }]}>
                            S/ {stats.todayEarnings.toFixed(2)}
                        </Text>
                        <Text style={styles.statLabel}>Ganado Hoy</Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.totalDeliveries}</Text>
                        <Text style={styles.statLabel}>Total Entregas</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: COLORS.success }]}>
                            S/ {stats.totalEarnings.toFixed(2)}
                        </Text>
                        <Text style={styles.statLabel}>Total Ganado</Text>
                    </View>
                </View>

                {/* Profile Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información Personal</Text>

                    <View style={styles.infoRow}>
                        <User size={20} color={COLORS.gray500} />
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Nombre completo"
                            />
                        ) : (
                            <Text style={styles.infoText}>{profile?.full_name || 'Sin nombre'}</Text>
                        )}
                    </View>

                    <View style={styles.infoRow}>
                        <Phone size={20} color={COLORS.gray500} />
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Teléfono"
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text style={styles.infoText}>{profile?.phone || 'Sin teléfono'}</Text>
                        )}
                    </View>

                    <View style={styles.infoRow}>
                        <Mail size={20} color={COLORS.gray500} />
                        <Text style={styles.infoText}>{profile?.email}</Text>
                    </View>
                </View>

                {/* Vehicle Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vehículo</Text>

                    <View style={styles.infoRow}>
                        <Truck size={20} color={COLORS.gray500} />
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={vehicleType}
                                onChangeText={setVehicleType}
                                placeholder="Tipo (Moto, Bicicleta, Auto)"
                            />
                        ) : (
                            <Text style={styles.infoText}>{profile?.vehicle_type || 'No especificado'}</Text>
                        )}
                    </View>

                    <View style={styles.infoRow}>
                        <MapPin size={20} color={COLORS.gray500} />
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={vehiclePlate}
                                onChangeText={setVehiclePlate}
                                placeholder="Placa del vehículo"
                                autoCapitalize="characters"
                            />
                        ) : (
                            <Text style={styles.infoText}>{profile?.vehicle_plate || 'Sin placa'}</Text>
                        )}
                    </View>
                </View>

                {/* Edit Actions */}
                {editing && (
                    <View style={styles.editActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => {
                                setEditing(false);
                                // Reset to original values
                                setFullName(profile?.full_name || '');
                                setPhone(profile?.phone || '');
                                setVehicleType(profile?.vehicle_type || 'Moto');
                                setVehiclePlate(profile?.vehicle_plate || '');
                            }}
                        >
                            <X size={20} color={COLORS.gray700} />
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.saveButton]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <>
                                    <Check size={20} color={COLORS.white} />
                                    <Text style={styles.saveButtonText}>Guardar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color={COLORS.error} />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 3,
    },
    statusDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.gray700,
    },
    email: {
        fontSize: 14,
        color: COLORS.gray500,
        marginTop: 4,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.gray50,
    },
    editButtonText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.gray500,
        marginTop: 4,
    },
    section: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray500,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    infoText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.gray700,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.gray700,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primary,
        paddingVertical: 4,
    },
    editActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    cancelButton: {
        backgroundColor: COLORS.gray100,
    },
    cancelButtonText: {
        color: COLORS.gray700,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    saveButtonText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    logoutText: {
        color: COLORS.error,
        fontWeight: '600',
        fontSize: 16,
    },
});
