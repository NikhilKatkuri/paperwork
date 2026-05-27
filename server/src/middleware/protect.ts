import config from '@/config';
import { AppError } from '@/utils/AppError';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomAuthRequest as CustomRequest } from '@/types';

const protect = (req: CustomRequest, _res: Response, next: NextFunction) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (
            !authorizationHeader ||
            !authorizationHeader.startsWith('Bearer ')
        ) {
            throw AppError.Unauthorized('unauthorized');
        }

        const token = authorizationHeader.split(' ')[1];
        if (!token) {
            throw AppError.Unauthorized('unauthorized');
        }

        const decodedToken = jwt.verify(token, config.JWT_SECRET) as {
            userId: string;
            email: string;
        } | null;
        if (!decodedToken || !decodedToken.userId) {
            throw AppError.Unauthorized('unauthorized');
        }
        req.user = {
            id: decodedToken.userId,
            email: decodedToken.email,
        };
        next();
    } catch (error) {
        next(AppError.Unauthorized('unauthorized'));
    }
};

export default protect;
