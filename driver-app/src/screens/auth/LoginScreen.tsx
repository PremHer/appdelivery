import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../services/supabase';
import { COLORS } from '../../constants';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa email y contraseña');
            return;
        }

        setLoading(true);
        try {
            // 1. Login with Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                // 2. Verify Role
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', data.session.user.id)
                    .single();

                if (userError) throw userError;

                if (userData?.role !== 'driver') {
                    await supabase.auth.signOut();
                    Alert.alert('Acceso Denegado', 'Esta app es solo para repartidores.');
                }
            }
        } catch (error: any) {
            Alert.alert('Error de Sesión', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Delivery App</Text>
                <Text style={styles.subtitle}>Conductores</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Mail color={COLORS.gray500} size={20} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Lock color={COLORS.gray500} size={20} />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                            <EyeOff color={COLORS.gray500} size={20} />
                        ) : (
                            <Eye color={COLORS.gray500} size={20} />
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Iniciar Sesión</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.gray500,
        fontWeight: '500',
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: COLORS.gray100,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: COLORS.black,
    },
    button: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
