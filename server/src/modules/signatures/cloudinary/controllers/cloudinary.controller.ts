import CloudinaryService from '../service/cloudinary.service';
import { Response } from 'express';
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/utils/AppError';

class CloudinaryController {
    private readonly service = CloudinaryService;

    constructor() {
        this.getSignature = this.getSignature.bind(this);
    }

    async getSignature(_req: Request, res: Response) {
        try {
            const signature = await this.service.getSignature();

            res.status(StatusCodes.OK).json({
                success: true,
                data: signature,
            });
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw AppError.Internal('Internal server error');
        }
    }
}

export default new CloudinaryController();
