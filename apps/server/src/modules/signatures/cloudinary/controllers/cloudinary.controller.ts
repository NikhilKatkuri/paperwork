import CloudinaryService from '../service/cloudinary.service';
import { Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';

class CloudinaryController {
    private readonly service = CloudinaryService;

    constructor() {
        this.getSignature = this.getSignature.bind(this);
    }

    getSignature(_req: Request, res: Response, next: (err: unknown) => void) {
        try {
            const signature = this.service.getSignature();

            res.status(StatusCodes.OK).json({
                success: true,
                data: signature,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new CloudinaryController();
