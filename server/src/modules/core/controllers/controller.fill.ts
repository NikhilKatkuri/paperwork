import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CustomAuthRequest as Request } from '@/types';
import FillService from '@/modules/core/service/service.fill';
import { AppError } from '@/utils/AppError';

class FillController {
    service = new FillService();
    constructor() {
        const methods = Object.getOwnPropertyNames(
            FillController.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }
    async fill(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId } = req.user!;
            if (!userId) {
                throw AppError.Unauthorized('User not authenticated');
            }

            const { formId } = req.params as { formId: string };
            if (!formId) {
                throw AppError.BadRequest('Form ID is required');
            }

            const formData = await this.service.get(formId, userId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form retrieved successfully',
                data: formData,
            });
        } catch (error) {
            next(error);
        }
    }
    async submit(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId, email } = req.user!;
            if (!userId || !email) {
                throw AppError.Unauthorized('User not authenticated');
            }
            const { formId } = req.params as { formId: string };
            if (!formId) {
                throw AppError.BadRequest('Form ID is required');
            }

            await this.service.post({
                formId,
                userId,
                email,
                answers: req.body.data,
            });
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form submitted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export default FillController;
