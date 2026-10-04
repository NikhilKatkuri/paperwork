import config from '@/config';
import { Response, Request } from 'express';
import { AppError } from './AppError';

class AutoBoundClass {
    constructor() {
        this.bindMethods();
    }
    private bindMethods() {
        const proto = Object.getPrototypeOf(this);
        const methods = Object.getOwnPropertyNames(proto).filter(
            (method) => method !== 'constructor'
        );

        for (const method of methods) {
            if (typeof (this as any)[method] === 'function') {
                (this as any)[method] = (this as any)[method].bind(this);
            }
        }
    }
}

class AutoBoundController extends AutoBoundClass {
    cookieSetter = (
        res: Response,
        name: string,
        value: string | number,
        maxAge: number = 7 * 24 * 60 * 60 * 1000
    ) => {
        res.cookie(name, value, {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'lax',
            maxAge: maxAge,
        });
    };

    clearCookie = (res: Response, name: string) => {
        res.clearCookie(name, {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'lax',
        });
    };

    getContext(req: Request) {
        const { id: userId, email } = req.user || {};
        if (!userId || !email) {
            throw AppError.Unauthorized('User not authenticated');
        }
        return { userId, email };
    }
}

export { AutoBoundController };
export default AutoBoundClass;
