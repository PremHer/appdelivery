import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import supabaseAdmin from '../config/supabase';
import { AppError } from '../middleware/error';
import type { User } from '../types/database';

interface RegisterInput {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
}

interface LoginInput {
    email: string;
    password: string;
}

interface AuthResponse {
    user: Omit<User, 'password_hash'>;
    token: string;
}

// Tabla de usuarios con password (para autenticación local)
interface UserWithPassword {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
}

export class AuthService {
    private static generateToken(userId: string, email: string): string {
        return jwt.sign(
            { userId, email },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );
    }

    static async register(input: RegisterInput): Promise<AuthResponse> {
        const { email, password, full_name, phone } = input;

        // Verificar si el usuario ya existe
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            throw new AppError('El email ya está registrado', 409);
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        // Crear usuario en Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.toLowerCase(),
            password,
            email_confirm: true,
        });

        if (authError) {
            throw new AppError('Error al crear usuario: ' + authError.message, 500);
        }

        // Crear perfil de usuario
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authUser.user.id,
                email: email.toLowerCase(),
                full_name,
                phone: phone || null,
                is_active: true,
            } as any)
            .select()
            .single();

        if (userError) {
            // Rollback: eliminar usuario de auth si falla
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            throw new AppError('Error al crear perfil de usuario', 500);
        }

        // Guardar hash de contraseña separado (para login local)
        await supabaseAdmin.from('user_passwords').insert({
            user_id: (user as any).id,
            password_hash,
        } as any);

        const token = this.generateToken((user as any).id, (user as any).email);

        return { user: user as any, token };
    }

    static async login(input: LoginInput): Promise<AuthResponse> {
        const { email, password } = input;

        // Buscar usuario
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('is_active', true)
            .single();

        if (error || !user) {
            throw new AppError('Credenciales inválidas', 401);
        }

        // Obtener hash de contraseña
        const { data: passwordData } = await supabaseAdmin
            .from('user_passwords')
            .select('password_hash')
            .eq('user_id', (user as any).id)
            .single();

        if (!passwordData) {
            throw new AppError('Credenciales inválidas', 401);
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, (passwordData as any).password_hash);

        if (!isValidPassword) {
            throw new AppError('Credenciales inválidas', 401);
        }

        const token = this.generateToken((user as any).id, (user as any).email);

        return { user: user as any, token };
    }

    static async getProfile(userId: string): Promise<User> {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        return user as any;
    }

    static async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
        // No permitir actualizar campos sensibles
        const { id, email, is_active, created_at, ...safeUpdates } = updates as User;

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update({
                ...safeUpdates,
                updated_at: new Date().toISOString(),
            } as any)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new AppError('Error al actualizar perfil', 500);
        }

        return user as any;
    }

    static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        // Obtener hash actual
        const { data: passwordData } = await supabaseAdmin
            .from('user_passwords')
            .select('password_hash')
            .eq('user_id', userId)
            .single();

        if (!passwordData) {
            throw new AppError('Usuario no encontrado', 404);
        }

        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(currentPassword, (passwordData as any).password_hash);

        if (!isValidPassword) {
            throw new AppError('Contraseña actual incorrecta', 401);
        }

        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña
        const { error } = await supabaseAdmin
            .from('user_passwords')
            .update({ password_hash, updated_at: new Date().toISOString() } as any)
            .eq('user_id', userId);

        if (error) {
            throw new AppError('Error al cambiar contraseña', 500);
        }
    }

    static async requestPasswordReset(email: string): Promise<void> {
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (!user) {
            // No revelar si el email existe o no
            return;
        }

        // Generar token de reset
        const resetToken = jwt.sign(
            { userId: (user as any).id, type: 'password_reset' },
            env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // TODO: Enviar email con el token
        console.log('Reset token:', resetToken);
    }
}

export default AuthService;
