import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TextInput,
    Animated,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Image,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../services/supabase';
import { COLORS, SIZES } from '../../constants';
import { useAuthStore } from '../../context/stores';
import authService from '../../services/auth.service';

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: '319484744982-nbef4414ui66r9on2l85hchfmbgpjroi.apps.googleusercontent.com',
    offlineAccess: true,
});

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const loginSchema = z.object({
    email: z.string().email('Email inválido').min(1, 'El email es requerido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginScreenProps {
    navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isFacebookLoading, setIsFacebookLoading] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const passwordInputRef = useRef<TextInput>(null);
    const headerHeight = useRef(new Animated.Value(1)).current;
    const login = useAuthStore((state) => state.login);

    // Handle Google Sign-In
    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (!idToken) {
                throw new Error('No se pudo obtener el token de Google');
            }

            const result = await authService.signInWithGoogleIdToken(idToken);
            login(result.user, result.token);
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // User cancelled the login flow
                console.log('User cancelled Google Sign-In');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('Error', 'Ya hay un inicio de sesión en progreso');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Google Play Services no está disponible');
            } else {
                Alert.alert('Error', error.message || 'No se pudo iniciar sesión con Google');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    // Handle Facebook Sign-In
    const handleFacebookSignIn = async () => {
        setIsFacebookLoading(true);
        try {
            // Get OAuth URL from Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: 'sajinoexpress://auth/callback',
                    skipBrowserRedirect: true, // Get URL instead of auto-redirecting
                },
            });

            if (error) throw error;

            if (data?.url) {
                // Open the OAuth URL in the browser
                const supported = await Linking.canOpenURL(data.url);
                if (supported) {
                    await Linking.openURL(data.url);
                } else {
                    Alert.alert('Error', 'No se puede abrir el navegador');
                }
            }
        } catch (error: any) {
            console.error('Facebook login error:', error);
            Alert.alert('Error', error.message || 'No se pudo iniciar sesión con Facebook');
        } finally {
            setIsFacebookLoading(false);
        }
    };

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await authService.login(data);
            login(response.user, response.token);
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'No se pudo iniciar sesión. Intenta de nuevo.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Scroll to input when focused
    const handleInputFocus = (inputName: string) => {
        setIsKeyboardVisible(true);
        // Animate header to shrink
        Animated.timing(headerHeight, {
            toValue: 0.6,
            duration: 200,
            useNativeDriver: false,
        }).start();

        // Scroll appropriately based on which input
        setTimeout(() => {
            if (inputName === 'password') {
                scrollViewRef.current?.scrollTo({ y: 120, animated: true });
            } else {
                scrollViewRef.current?.scrollTo({ y: 80, animated: true });
            }
        }, 100);
    };

    const handleInputBlur = () => {
        setIsKeyboardVisible(false);
        Animated.timing(headerHeight, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const animatedHeaderStyle = {
        height: headerHeight.interpolate({
            inputRange: [0.6, 1],
            outputRange: [SCREEN_HEIGHT * 0.18, SCREEN_HEIGHT * 0.28],
        }),
        paddingTop: headerHeight.interpolate({
            inputRange: [0.6, 1],
            outputRange: [20, 40],
        }),
    };

    const animatedLogoSize = headerHeight.interpolate({
        inputRange: [0.6, 1],
        outputRange: [50, 80],
    });

    const animatedTitleSize = headerHeight.interpolate({
        inputRange: [0.6, 1],
        outputRange: [22, 32],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Header con gradiente - Animated */}
                    <Animated.View style={[styles.headerContainer, animatedHeaderStyle]}>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.header}
                        >
                            <View style={styles.logoContainer}>
                                <Animated.View style={[styles.logoCircle, {
                                    width: animatedLogoSize,
                                    height: animatedLogoSize,
                                    borderRadius: 100,
                                    overflow: 'hidden',
                                }]}>
                                    <Image
                                        source={require('../../../assets/logo.jpg')}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="contain"
                                    />
                                </Animated.View>
                            </View>
                            <Animated.Text style={[styles.title, { fontSize: animatedTitleSize }]}>
                                Sajino Express
                            </Animated.Text>
                            {!isKeyboardVisible && (
                                <Text style={styles.subtitle}>
                                    ¡Rápido como un sajino! 🐗💨
                                </Text>
                            )}
                        </LinearGradient>
                    </Animated.View>

                    {/* Formulario */}
                    <View style={styles.formContainer}>
                        <View style={styles.form}>
                            <Text style={styles.formTitle}>Iniciar Sesión</Text>

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
                                        onBlur={() => {
                                            onBlur();
                                            handleInputBlur();
                                        }}
                                        onFocus={() => handleInputFocus('email')}
                                        error={errors.email?.message}
                                        returnKeyType="next"
                                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Contraseña"
                                        placeholder="Tu contraseña"
                                        isPassword
                                        leftIcon="lock-closed-outline"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={() => {
                                            onBlur();
                                            handleInputBlur();
                                        }}
                                        onFocus={() => handleInputFocus('password')}
                                        error={errors.password?.message}
                                        returnKeyType="done"
                                        onSubmitEditing={handleSubmit(onSubmit)}
                                    />
                                )}
                            />

                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={styles.forgotPasswordText}>
                                    ¿Olvidaste tu contraseña?
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                                onPress={handleSubmit(onSubmit)}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={isLoading ? ['#ccc', '#bbb'] : [COLORS.primary, '#FF8C42']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.loginButtonGradient}
                                >
                                    {isLoading ? (
                                        <Text style={styles.loginButtonText}>Cargando...</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>o continúa con</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Social login buttons */}
                            <View style={styles.socialButtons}>
                                <TouchableOpacity
                                    style={[styles.socialButton, isGoogleLoading && styles.socialButtonLoading]}
                                    activeOpacity={0.7}
                                    onPress={handleGoogleSignIn}
                                    disabled={isGoogleLoading}
                                >
                                    {isGoogleLoading ? (
                                        <ActivityIndicator size="small" color="#EA4335" />
                                    ) : (
                                        <Ionicons name="logo-google" size={22} color="#EA4335" />
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.socialButton, isFacebookLoading && styles.socialButtonLoading]}
                                    activeOpacity={0.7}
                                    onPress={handleFacebookSignIn}
                                    disabled={isFacebookLoading}
                                >
                                    {isFacebookLoading ? (
                                        <ActivityIndicator size="small" color="#1877F2" />
                                    ) : (
                                        <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Botón Invitado */}
                            <TouchableOpacity
                                style={styles.guestButton}
                                onPress={() => {
                                    login({
                                        id: 'guest-123',
                                        email: 'invitado@delivery.app',
                                        full_name: 'Invitado',
                                        phone: '',
                                        avatar_url: null,
                                        address: null,
                                        latitude: null,
                                        longitude: null,
                                        is_active: true,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString()
                                    }, 'guest-token');
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="person-outline" size={18} color={COLORS.gray500} />
                                <Text style={styles.guestButtonText}>
                                    Continuar como invitado
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Register link */}
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.registerLink}>Regístrate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray50,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    headerContainer: {
        overflow: 'hidden',
    },
    header: {
        flex: 1,
        paddingHorizontal: SIZES.lg,
        paddingBottom: 30,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    logoCircle: {
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontWeight: '800',
        color: COLORS.white,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 6,
    },
    formContainer: {
        flex: 1,
        marginTop: -25,
        paddingHorizontal: 20,
    },
    form: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.gray800,
        marginBottom: 20,
        textAlign: 'center',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        marginTop: -8,
    },
    forgotPasswordText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        shadowOpacity: 0,
    },
    loginButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.gray200,
    },
    dividerText: {
        marginHorizontal: 16,
        color: COLORS.gray400,
        fontSize: 13,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.gray50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.gray100,
    },
    socialButtonLoading: {
        opacity: 0.6,
    },
    guestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        paddingVertical: 12,
        gap: 8,
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
    },
    guestButtonText: {
        color: COLORS.gray600,
        fontWeight: '600',
        fontSize: 14,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 28,
    },
    registerText: {
        color: COLORS.gray500,
        fontSize: 15,
    },
    registerLink: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '700',
    },
});

export default LoginScreen;
