import { Request, NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import SectionService from '@/modules/forms/service/service.sections';
import { AppError } from '@/utils/AppError';

class SectionController {
    service = new SectionService();

    constructor() {
        const methods = Object.getOwnPropertyNames(
            SectionController.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    private getContextData(req: Request, requiresSection: boolean = false) {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.Unauthorized('User not authenticated');
        }

        const { formId, sectionId } = req.params as Record<string, string>;

        if (!formId) {
            throw AppError.BadRequest(
                'Form ID is missing from request parameters'
            );
        }

        if (requiresSection && !sectionId) {
            throw AppError.BadRequest(
                'Section ID is required for this operation'
            );
        }

        return {
            userId,
            formId,
            sectionId,
            data: req.body?.data,
        };
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { formId, userId, data } = this.getContextData(req);
            if (!data) {
                throw AppError.SectionCreationFailed('No data provided');
            }

            const createdSection = await this.service.create(
                userId,
                formId,
                data
            );
            res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Section created successfully',
                data: { section: createdSection },
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { sectionId, formId, userId } = this.getContextData(
                req,
                true
            );
            if (!sectionId) {
                throw AppError.SectionNotFound('No section ID provided');
            }
            await this.service.delete({ sectionId, formId, userId });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { sectionId, data, ...rest } = this.getContextData(req, true);

            if (!data) {
                throw AppError.SectionUpdateFailed('No data provided');
            }
            if (!sectionId) {
                throw AppError.SectionNotFound('No section ID provided');
            }

            const updatedSection = await this.service.update(
                { sectionId, ...rest },
                data
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Section updated successfully',
                data: { section: updatedSection },
            });
        } catch (error) {
            next(error);
        }
    }

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { formId, userId } = this.getContextData(req);
            if (!formId) {
                throw AppError.FormNotFound('No form ID provided');
            }
            const sections = await this.service.get(formId, userId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Sections retrieved successfully',
                data: { sections },
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { sectionId, ...rest } = this.getContextData(req, true);
            if (!sectionId) {
                throw AppError.SectionNotFound('No section ID provided');
            }

            const section = await this.service.getById({ sectionId, ...rest });
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Section retrieved successfully',
                data: { section },
            });
        } catch (error) {
            next(error);
        }
    }

    async reorder(req: Request, res: Response, next: NextFunction) {
        try {
            const { data, ...rest } = this.getContextData(req, true);
            if (!data) {
                throw AppError.SectionReorderFailed('No data provided');
            }
            const reorderedSections = await this.service.reorder(
                { ...rest },
                data
            );
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Sections reordered successfully',
                data: { sections: reorderedSections },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default SectionController;
