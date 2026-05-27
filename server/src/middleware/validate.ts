import { ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

const validate =
    (schema: ZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            next();
        } catch (error: any) {
            res.status(400).json({
                success: false,
                errors: error.errors,
            });
            return;
        }
    };

export default validate;
