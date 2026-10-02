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
