import AutoBoundClass from '@/utils/AutoBoundClass';
import { NextFunction, Response, Request } from 'express';
import TemplatesService from '../service/service.templates';

class TemplatesController extends AutoBoundClass {
    constructor() {
        super();
    }

    service = new TemplatesService();

    async all(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await this.service.all(req.query);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async getByTemplateId(req: Request, res: Response, next: NextFunction) {
        try {
            const { templateId } = req.params;
            if (typeof templateId !== 'string') {
                return res
                    .status(400)
                    .json({ success: false, message: 'Invalid template ID' });
            }
            const data = await this.service.getByTemplateId(templateId);
            return res.status(200).json({ success: true, data });
        } catch (error: any) {
            if (error.message === 'Template not found') {
                return res
                    .status(404)
                    .json({ success: false, message: error.message });
            }
            return next(error);
        }
    }

    async cloneByTemplateId(req: Request, res: Response, next: NextFunction) {
        try {
            const { templateId } = req.params;
            if (typeof templateId !== 'string') {
                return res
                    .status(400)
                    .json({ success: false, message: 'Invalid template ID' });
            }
            const userId = (req as any).user?.id || (req as any).user?.userId;
            const customName = req.body?.name;

            if (!userId) {
                return res
                    .status(401)
                    .json({ success: false, message: 'Unauthorized user' });
            }

            const data = await this.service.cloneByTemplateId(
                templateId,
                userId,
                customName
            );
            return res.status(201).json({ success: true, data });
        } catch (error: any) {
            if (error.message === 'Template not found') {
                return res
                    .status(404)
                    .json({ success: false, message: error.message });
            }
            return next(error);
        }
    }

    async seed(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await this.service.seed(req.body);
            return res.status(201).json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }
}

export default TemplatesController;
