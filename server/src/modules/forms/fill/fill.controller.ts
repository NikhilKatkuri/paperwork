import { Request, Response, NextFunction } from 'express';
import FillService from './fill.service';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/utils/AppError';

class FillController {
    service = new FillService();
    constructor() {
        this.fill = this.fill.bind(this);
    }
    async fill(req: Request, res: Response, next: NextFunction) {
        try {
            const { formId } = req.params as { formId: string };
            if (!formId) {
                throw AppError.BadRequest('Form ID is required');
            }

            const formData = await this.service.get(formId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form retrieved successfully',
                data: formData,
            });
        } catch (error) {
            next(error);
        }
    }
    async submit(_req: Request, _res: Response, next: NextFunction) {
        try {
            throw AppError.NotImplemented(
                'Form submission not yet implemented'
            );
        } catch (error) {
            next(error);
        }
    }
}

export default FillController;
