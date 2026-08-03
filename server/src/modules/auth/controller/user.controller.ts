import { Request } from 'express';
import { NextFunction, Response } from 'express';
import { AccountActionService } from '../types/auth.types';
import { StatusCodes } from 'http-status-codes';
import { sensitiveData } from '../types/profile.auth';
import UserServiceBoot from '../service/user.service';
import { AutoBoundController } from '@/utils/AutoBoundClass';

class UserController extends AutoBoundController {
    constructor() {
        super();
    }

    async accountActions(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = this.getContext(req);
            const data = req.body as AccountActionService;
            const result = await UserServiceBoot.account(data, userId);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            next(error);
        }
    }

    async personalInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = this.getContext(req);
            const data = req.body as sensitiveData;
            const result = await UserServiceBoot.PersonalInfo(
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
        try {
            const { userId } = this.getContext(req);
            const result = await UserServiceBoot.getPersonalInfo(userId);
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
