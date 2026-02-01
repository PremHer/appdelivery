import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationType = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, type: ValidationType = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const dataToValidate = req[type];
            schema.parse(dataToValidate);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                res.status(400).json({
                    success: false,
                    message: 'Error de validación',
                    errors: formattedErrors,
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
            });
        }
    };
};
