import * as express from 'express';

declare global {
    namespace Express {
        interface Request {
            /**
             * Correlation id for this request, assigned by
             * `src/middleware/requestId.ts` before any other middleware runs.
             * Echoed on the response as `X-Request-ID`.
             */
            id: string;
            user?: {
                id: string;
                email: string;
            };
        }
    }
}
