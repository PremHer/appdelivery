import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuthService } from '../services/auth.service';

export class AuthController {
    static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { email, password, full_name, phone } = req.body;

            const result = await AuthService.register({
                email,
                password,
                full_name,
                phone,
            });

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Error al registrar usuario',
            });
        }
    }

    static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            const result = await AuthService.login({ email, password });

            res.json({
                success: true,
                message: 'Login exitoso',
                data: result,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Error al iniciar sesión',
            });
        }
    }

    static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'No autorizado',
                });
                return;
            }

            const user = await AuthService.getProfile(req.user.id);

            res.json({
                success: true,
                data: user,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Error al obtener perfil',
            });
        }
    }

    static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'No autorizado',
                });
                return;
            }

            const user = await AuthService.updateProfile(req.user.id, req.body);

            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: user,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Error al actualizar perfil',
            });
        }
    }

    static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'No autorizado',
                });
                return;
            }

            const { current_password, new_password } = req.body;

            await AuthService.changePassword(req.user.id, current_password, new_password);

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente',
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Error al cambiar contraseña',
            });
        }
    }

    static async requestPasswordReset(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            await AuthService.requestPasswordReset(email);

            // Siempre responder con éxito para no revelar si el email existe
            res.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Error al solicitar restablecimiento',
            });
        }
    }
}

export default AuthController;
