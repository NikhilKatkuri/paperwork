import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

const validate =
    (schema: z.ZodObject<any>) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            req.body = parsed.body;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    errors: error.flatten(),
                    message: 'Validation failed',
                });
                return;
            }
            next(error);
        }
    };

export default validate;
