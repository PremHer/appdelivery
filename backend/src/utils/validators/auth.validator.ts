import { z } from 'zod';

export const registerSchema = z.object({
    email: z
        .string()
        .email('Email inválido')
        .min(1, 'El email es requerido')
        .transform((v) => v.toLowerCase()),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
        ),
    full_name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    phone: z
        .string()
        .regex(/^\+?[\d\s-]{8,15}$/, 'Número de teléfono inválido')
        .optional(),
});

export const loginSchema = z.object({
    email: z
        .string()
        .email('Email inválido')
        .min(1, 'El email es requerido')
        .transform((v) => v.toLowerCase()),
    password: z.string().min(1, 'La contraseña es requerida'),
});

export const updateProfileSchema = z.object({
    full_name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .optional(),
    phone: z
        .string()
        .regex(/^\+?[\d\s-]{8,15}$/, 'Número de teléfono inválido')
        .optional()
        .nullable(),
    avatar_url: z.string().url('URL de avatar inválida').optional().nullable(),
    address: z.string().max(500, 'La dirección no puede exceder 500 caracteres').optional().nullable(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, 'La contraseña actual es requerida'),
    new_password: z
        .string()
        .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
        ),
});

export const requestResetSchema = z.object({
    email: z
        .string()
        .email('Email inválido')
        .min(1, 'El email es requerido')
        .transform((v) => v.toLowerCase()),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
