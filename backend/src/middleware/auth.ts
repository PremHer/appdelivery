import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import supabaseAdmin from '../config/supabase';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        full_name: string;
    };
}

export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No se proporcionó token de autenticación',
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

            // Verificar que el usuario existe en la base de datos
            const { data: user, error } = await supabaseAdmin
                .from('users')
                .select('id, email, full_name')
                .eq('id', decoded.userId)
                .eq('is_active', true)
                .single();

            if (error || !user) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado o inactivo',
                });
                return;
            }

            req.user = user;
            next();
        } catch (jwtError) {
            res.status(401).json({
                success: false,
                message: 'Token inválido o expirado',
            });
            return;
        }
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
};

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

            const { data: user } = await supabaseAdmin
                .from('users')
                .select('id, email, full_name')
                .eq('id', decoded.userId)
                .eq('is_active', true)
                .single();

            if (user) {
                req.user = user;
            }
        } catch {
            // Token inválido, continuar sin usuario
        }

        next();
    } catch (error) {
        next();
    }
};
