import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Error interno del servidor';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
        }),
    });
};

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.path}`,
    });
};

// Clase de error personalizada
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
