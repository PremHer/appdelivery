import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES } from '../../constants';
import { useAuthStore } from '../../context/stores';
import Button from '../../components/ui/Button';

// Nota: authService ya tiene updateProfile pero no lo exportamos directamente en el store
// Deberíamos exponerlo en el store o usar authService directamente.
// Usaremos el store si tiene la función, o importaremos el servicio.
// Revisando auth.service.ts, tiene updateProfile.
// Revisando stores.ts (no lo veo pero asumo que podría no estar).
// Importaré authService directamente para editar.

import authService from '../../services/auth.service';

interface EditProfileScreenProps {
    navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
    const { user, setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [fullName, setFullName] = useState(user?.full_name || '');
    const [phone, setPhone] = useState(user?.phone || '');

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const updatedUser = await authService.updateProfile({
                full_name: fullName,
                phone: phone,
            });

            if (updatedUser) {
                // Actualizar store (mezclamos el usuario actual con los nuevos datos)
                // Nota: updatedUser es Partial<User> o User completo según implementación. 
                // authService devuelve User completo.
                setUser({ ...user, ...updatedUser });
                Alert.alert('Éxito', 'Perfil actualizado correctamente.');
                navigation.goBack();
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'No se pudo actualizar el perfil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
                <Text style={styles.title}>Editar Perfil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre Completo</Text>
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Tu nombre completo"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Tu número de teléfono"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={user?.email}
                        editable={false}
                    />
                    <Text style={styles.helperText}>El correo electrónico no se puede cambiar.</Text>
                </View>

                <Button
                    title="Guardar Cambios"
                    onPress={handleSave}
                    loading={loading}
                    style={styles.saveButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

// Necesitamos TouchableOpacity que no importé
import { TouchableOpacity } from 'react-native';

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
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    content: {
        padding: SIZES.lg,
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
    disabledInput: {
        backgroundColor: COLORS.gray100,
        color: COLORS.gray500,
    },
    helperText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
        marginTop: 4,
    },
    saveButton: {
        marginTop: SIZES.xl,
    },
});

export default EditProfileScreen;
