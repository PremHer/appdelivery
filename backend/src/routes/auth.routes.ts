import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
    requestResetSchema,
} from '../utils/validators/auth.validator';

const router = Router();

// Rutas públicas
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/forgot-password', validate(requestResetSchema), AuthController.requestPasswordReset);

// Rutas protegidas
router.get('/profile', authenticate, AuthController.getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), AuthController.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);

export default router;
