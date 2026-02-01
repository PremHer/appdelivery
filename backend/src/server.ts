import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

// Crear aplicación Express
const app: Application = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://tudominio.com']
        : ['http://localhost:3000', 'http://localhost:19006', 'http://localhost:8081'],
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
    max: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
    message: {
        success: false,
        message: 'Demasiadas solicitudes, por favor intenta más tarde',
    },
});
app.use(limiter);

// Middlewares de utilidad
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Trust proxy para obtener IP real
app.set('trust proxy', 1);

// Rutas de la API
app.use(`/api/${env.API_VERSION}`, routes);

// Health check endpoint para Railway
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Delivery App API',
        version: env.API_VERSION,
        documentation: `/api/${env.API_VERSION}/docs`,
    });
});

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores
app.use(errorHandler);

// Iniciar servidor
const PORT = parseInt(env.PORT);

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Delivery App API Server                              ║
║                                                           ║
║   Environment: ${env.NODE_ENV.padEnd(40)}║
║   Port: ${PORT.toString().padEnd(47)}║
║   API URL: http://localhost:${PORT}/api/${env.API_VERSION.padEnd(25)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
