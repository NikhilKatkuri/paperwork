import { CustomAuthRequest as Request } from '@/types';
import { AppError } from '@/utils/AppError';
import { NextFunction, Response } from 'express';
import { AccountActionService } from '../types/auth.types';
import UserService from '../service/user.service';
import { StatusCodes } from 'http-status-codes';
import { sensitiveData } from '../types/profile.auth';

class UserController {
    private service = new UserService();

    constructor() {
        const methods = Object.getOwnPropertyNames(
            UserController.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    private getContext(req: Request) {
        const { id: userId, email } = req.user || {};
        if (!userId || !email) {
            throw AppError.Unauthorized('User not authenticated');
        }
        return { userId, email };
    }

    async accountActions(req: Request, res: Response, next: NextFunction) {
        const { userId } = this.getContext(req);
        try {
            const data = req.body as AccountActionService;
            const result = await this.service.account(data, userId);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            next(error);
        }
    }

    async PersonalInfo(req: Request, res: Response, next: NextFunction) {
        const { userId } = this.getContext(req);
        try {
            const data = req.body as sensitiveData;
            const result = await this.service.PersonalInfo(
                data,
                userId,
                req.method === 'PUT' ? 'update' : 'add'
            );
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getPersonalInfo(req: Request, res: Response, next: NextFunction) {
        const { userId } = this.getContext(req);
        try {
            const result = await this.service.getPersonalInfo(userId);
            res.status(StatusCodes.OK).json({
                success: result !== null,
                data: result,
                message: 'retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export default UserController;
