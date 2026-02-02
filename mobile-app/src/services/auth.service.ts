import { supabase } from './supabase';
import type { User, AuthResponse } from '../types';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

// Configuración de Google OAuth
const GOOGLE_WEB_CLIENT_ID = '319484744982-nbef4414ui66r9on2l85hchfmbgpjroi.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '319484744982-klmgja5ccvg8j75d9h3lhvkjo7omqqk5.apps.googleusercontent.com';

WebBrowser.maybeCompleteAuthSession();

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export const authService = {
    async register(data: RegisterData): Promise<AuthResponse> {
        // 1. Crear usuario en Auth de Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.full_name,
                    phone: data.phone,
                }
            }
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error('No se pudo crear el usuario');

        // 2. Auth de Supabase debería disparar un trigger para crear el perfil, 
        // pero si no tienes triggers configurados en la BD, lo insertamos manualmente.
        // Verificamos si ya se creó el perfil
        const { data: existingProfile } = await supabase
            .from('users') // O 'profiles' dependiendo de tu tabla
            .select('*')
            .eq('id', authData.user.id)
            .single();

        let userProfile = existingProfile;

        if (!existingProfile) {
            const { data: newProfile, error: profileError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: data.email,
                    full_name: data.full_name,
                    phone: data.phone,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_active: true
                })
                .select()
                .single();

            if (profileError) {
                console.error('Error insertando perfil:', profileError);
                // No lanzamos error aquí para no bloquear el registro auth, pero es un problema.
            }
            userProfile = newProfile;
        }

        return {
            user: userProfile as User || { ...authData.user, full_name: data.full_name } as any,
            token: authData.session?.access_token || '',
        };
    },

    async login(data: LoginData): Promise<AuthResponse> {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) throw new Error(error.message);
        if (!authData.user || !authData.session) throw new Error('Error de autenticación');

        // Obtener perfil completo con manejo robusto
        let userProfile;

        const { data: existingProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle(); // Usar maybeSingle para evitar error JSON object si no existe

        if (existingProfile) {
            userProfile = existingProfile;
        } else {
            // Si el perfil no existe en public.users, lo creamos ahora
            console.log('Perfil no encontrado, creando uno nuevo...');
            const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: authData.user.email,
                    full_name: authData.user.user_metadata?.full_name || 'Usuario',
                    phone: authData.user.user_metadata?.phone,
                    created_at: new Date().toISOString(),
                    is_active: true
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creando perfil fallback:', createError);
                // Fallback básico si falla la creación
                userProfile = { ...authData.user, full_name: 'Usuario' };
            } else {
                userProfile = newProfile;
            }
        }

        return {
            user: userProfile as User,
            token: authData.session.access_token,
        };
    },

    async getProfile(): Promise<User> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No hay sesión activa');

        const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw new Error(error.message);
        return userProfile as User;
    },

    async updateProfile(data: Partial<User>): Promise<User> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No hay sesión activa');

        const { data: updatedProfile, error } = await supabase
            .from('users')
            .update(data)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return updatedProfile as User;
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        // En Supabase client no necesitas la password actual para updatear si ya estás logueado
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw new Error(error.message);
    },

    async requestPasswordReset(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw new Error(error.message);
    },

    // Método helper para login social (Google, etc)
    async loginWithProvider(provider: 'google' | 'apple' | 'facebook'): Promise<void> {
        // Esto redirige al navegador para OAuth
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
        });
        if (error) throw new Error(error.message);
    },

    // Google OAuth específico para móvil
    getGoogleAuthConfig() {
        return {
            webClientId: GOOGLE_WEB_CLIENT_ID,
            androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        };
    },

    async signInWithGoogleIdToken(idToken: string): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
        });

        if (error) throw new Error(error.message);
        if (!data.user || !data.session) throw new Error('Error de autenticación con Google');

        // Obtener o crear perfil
        let userProfile;
        const { data: existingProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

        if (existingProfile) {
            userProfile = existingProfile;
        } else {
            const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Usuario Google',
                    avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
                    created_at: new Date().toISOString(),
                    is_active: true
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creando perfil Google:', createError);
                userProfile = { ...data.user, full_name: data.user.user_metadata?.name || 'Usuario' };
            } else {
                userProfile = newProfile;
            }
        }

        return {
            user: userProfile as User,
            token: data.session.access_token,
        };
    }
};

export default authService;

