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
            if (parsed.body !== undefined) req.body = parsed.body;
            if ((parsed as any).query !== undefined) {
                // Express 5 defines `req.query` as a getter-only property —
                // direct assignment throws "Cannot set property query ...
                // which has only a getter". Redefine it on the instance.
                Object.defineProperty(req, 'query', {
                    value: (parsed as any).query,
                    writable: true,
                    enumerable: true,
                    configurable: true,
                });
            }
            if ((parsed as any).params !== undefined)
                req.params = (parsed as any).params as any;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                /**
                 * `flatten()` groups by the top-level key only, which for these
                 * schemas is always "body" - useless for finding the offending
                 * field. Include the full issue paths so a failed batch can be
                 * diagnosed from the client without reproducing it.
                 */
                const issues = error.issues.map((issue) => ({
                    path: issue.path.join('.') || '(root)',
                    message: issue.message,
                }));

                res.status(400).json({
                    success: false,
                    errors: error.flatten(),
                    issues,
                    message: issues.length
                        ? `Validation failed: ${issues
                              .map((i) => `${i.path} - ${i.message}`)
                              .join('; ')}`
                        : 'Validation failed',
                });
                return;
            }
            next(error);
        }
    };

export default validate;
