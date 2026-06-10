import domains from '@/data/disposable-domains.json';
import { Response, NextFunction } from 'express';
import { CustomAuthRequest as Request } from '@/types';
import { StatusCodes } from 'http-status-codes';

const disposableDomains = new Set(domains);

async function validateDomain(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body as { email: string };
    const domain = email.split('@')[1];
    if (!domain) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'invalid domain',
        });
        return;
    }

    if (disposableDomains.has(domain.toLowerCase())) {
        res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'Invalid domain or disposable email',
        });
        return;
    }
    return next();
}

export default validateDomain;
