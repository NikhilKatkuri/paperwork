import { NextFunction, Response } from 'express';
import { CustomAuthRequest as Request } from '@/types';
import SectionService from './sections.service';
import { AppError } from '@/utils/AppError';
import { StatusCodes } from 'http-status-codes';

class SectionController {
    service = new SectionService();
    constructor() {
        this.create = this.create.bind(this);
        this.delete = this.delete.bind(this);
        this.update = this.update.bind(this);
        this.get = this.get.bind(this);
        this.getById = this.getById.bind(this);
        this.reorder = this.reorder.bind(this);
    }
    readIds(req: Request) {
        const { id: userId } = req.user!;
        if (!userId) {
            throw AppError.Unauthorized('User not authenticated');
        }

        const { id: formId } = req.params as { id: string };
        return { userId, formId };
    }

    readAllIds(req: Request) {
        const { sectionId } = req.params as { sectionId: string };
        return { ...this.readIds(req), sectionId };
    }

    async create(req: Request, res: Response, _next: NextFunction) {
        const { formId, userId } = this.readIds(req);
        const data = req.body.data;
        if (!data) {
            throw AppError.SectionCreationFailed('No data provided');
        }

        const createdSection = await this.service.create(userId, formId, data);
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Section created successfully',
            data: { section: createdSection },
        });
    }

    async delete(_req: Request, res: Response, _next: NextFunction) {
        const { sectionId } = this.readAllIds(_req);
        if (!sectionId) {
            throw AppError.SectionNotFound('No section ID provided');
        }
        await this.service.delete(sectionId);
        res.status(204).send();
    }

    async update(req: Request, res: Response, _next: NextFunction) {
        const { sectionId } = this.readAllIds(req);
        const data = req.body.data;
        if (!data) {
            throw AppError.SectionUpdateFailed('No data provided');
        }
        if (!sectionId) {
            throw AppError.SectionNotFound('No section ID provided');
        }
        const updatedSection = await this.service.update(sectionId, data);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Section updated successfully',
            data: { section: updatedSection },
        });
    }

    async get(req: Request, res: Response, _next: NextFunction) {
        const { formId } = this.readIds(req);
        if (!formId) {
            throw AppError.FormNotFound('No form ID provided');
        }
        const sections = await this.service.get(formId);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Sections retrieved successfully',
            data: { sections },
        });
    }

    async getById(req: Request, res: Response, _next: NextFunction) {
        const { sectionId } = this.readAllIds(req);
        if (!sectionId) {
            throw AppError.SectionNotFound('No section ID provided');
        }
        const section = await this.service.getById(sectionId);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Section retrieved successfully',
            data: { section },
        });
    }

    async reorder(req: Request, res: Response, _next: NextFunction) {
        const { formId } = this.readIds(req);
        const { data } = req.body;
        if (!data) {
            throw AppError.SectionReorderFailed('No data provided');
        }
        const reorderedSections = await this.service.reorder(formId, data);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Sections reordered successfully',
            data: { sections: reorderedSections },
        });
    }
}

export default SectionController;
