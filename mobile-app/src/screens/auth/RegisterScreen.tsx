import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS, SIZES } from '../../constants';
import { useAuthStore } from '../../context/stores';
import authService from '../../services/auth.service';

const registerSchema = z.object({
    full_name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre es muy largo'),
    email: z.string().email('Email inválido').min(1, 'El email es requerido'),
    phone: z
        .string()
        .regex(/^\+?[\d\s-]{8,15}$/, 'Número de teléfono inválido')
        .optional()
        .or(z.literal('')),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Debe contener mayúsculas, minúsculas y números'
        ),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterScreenProps {
    navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(false);
    const login = useAuthStore((state) => state.login);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            full_name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const { confirmPassword, ...registerData } = data;
            const response = await authService.register({
                ...registerData,
                phone: registerData.phone || undefined,
            });
            login(response.user, response.token);
            Alert.alert(
                '¡Bienvenido!',
                'Tu cuenta ha sido creada exitosamente.',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'No se pudo crear la cuenta. Intenta de nuevo.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.header}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={require('../../../assets/logo.jpg')}
                                    style={{ width: 50, height: 50 }}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                        <Text style={styles.title}>Únete a Sajino</Text>
                        <Text style={styles.subtitle}>
                            ¡Pide rápido como un jabalí! 🐗⚡
                        </Text>
                    </LinearGradient>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.form}>
                            <Controller
                                control={control}
                                name="full_name"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Nombre Completo"
                                        placeholder="Juan Pérez"
                                        autoCapitalize="words"
                                        leftIcon="person-outline"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.full_name?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Email"
                                        placeholder="tu@email.com"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        leftIcon="mail-outline"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.email?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="phone"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Teléfono (Opcional)"
                                        placeholder="+51 999 888 777"
                                        keyboardType="phone-pad"
                                        leftIcon="call-outline"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.phone?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Contraseña"
                                        placeholder="Mínimo 8 caracteres"
                                        isPassword
                                        leftIcon="lock-closed-outline"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.password?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Confirmar Contraseña"
                                        placeholder="Repite tu contraseña"
                                        isPassword
                                        leftIcon="lock-closed-outline"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={errors.confirmPassword?.message}
                                    />
                                )}
                            />

                            {/* Terms */}
                            <Text style={styles.terms}>
                                Al registrarte, aceptas nuestros{' '}
                                <Text style={styles.termsLink}>Términos de Servicio</Text> y{' '}
                                <Text style={styles.termsLink}>Política de Privacidad</Text>
                            </Text>

                            <Button
                                title="Crear Cuenta"
                                onPress={handleSubmit(onSubmit)}
                                loading={isLoading}
                                fullWidth
                                size="large"
                            />
                        </View>

                        {/* Login link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Inicia Sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: SIZES.lg,
        paddingBottom: SIZES.xxl,
        paddingHorizontal: SIZES.lg,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.md,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: SIZES.md,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SIZES.xs,
    },
    subtitle: {
        fontSize: SIZES.fontMd,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    formContainer: {
        flex: 1,
        marginTop: -20,
        paddingHorizontal: SIZES.lg,
    },
    form: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusXl,
        padding: SIZES.lg,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    terms: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
        textAlign: 'center',
        marginBottom: SIZES.lg,
        lineHeight: 20,
    },
    termsLink: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SIZES.lg,
        marginBottom: SIZES.lg,
    },
    loginText: {
        color: COLORS.gray600,
        fontSize: SIZES.fontMd,
    },
    loginLink: {
        color: COLORS.primary,
        fontSize: SIZES.fontMd,
        fontWeight: '600',
    },
});

export default RegisterScreen;
