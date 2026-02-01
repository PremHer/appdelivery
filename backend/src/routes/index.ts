import { Router } from 'express';
import authRoutes from './auth.routes';
import notificationsRoutes from './notifications.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
    });
});

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de notificaciones
router.use('/notifications', notificationsRoutes);

// TODO: Agregar más rutas
// router.use('/restaurants', restaurantRoutes);
// router.use('/products', productRoutes);
// router.use('/orders', orderRoutes);
// router.use('/addresses', addressRoutes);
// router.use('/categories', categoryRoutes);

export default router;
