import { ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

const validate =
    (schema: ZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            const { body, query, params } = parsed;
            req.body = body;
            req.query = query as any;
            req.params = params as any;

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
