import { NextFunction, Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import FormsService from '@/modules/forms/service/service.forms';

class FormsController {
    service = new FormsService();

    constructor() {
        const methods = Object.getOwnPropertyNames(
            FormsController.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    private getRequestData(req: Request) {
        return {
            userId: req.user!.id,
            formId: req.params.formId as string,
            bodyData: req.body?.data,
        };
    }

    /**
     *
     * @param req expects @Form
     * @param res return a form of type @FormDto
     */
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { bodyData, userId } = this.getRequestData(req);

            const newForm = await this.service.create({ ...bodyData, userId });

            res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Form created successfully',
                data: newForm,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Search for forms by name.
     * @req expects query parameters `q` (search query) and `limit` (number of results to return, default 10)
     * @res returns a list of forms matching the search query, or an empty list if no matches are found.
     */
    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);

            const form = await this.service.get(formId, userId);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form retrieved successfully',
                data: form,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Search for forms by name.
     * @param req expects query parameters `q` (search query) and `limit` (number of results to return, default 10)
     * @param res returns a list of forms matching the search query, or an empty list if no matches are found.
     */
    async search(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = this.getRequestData(req);
            const { q, limit } = (req.query ?? {}) as {
                q?: string;
                limit?: number;
            };

            const forms = await this.service.search(
                userId,
                q ?? '',
                limit ?? 10
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message: forms.length
                    ? 'Forms found successfully'
                    : 'No forms matched that search',
                data: { forms },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Deletes a form and all its sections and questions in a single transaction.
     * @param req expects @user userId, @form formId
     * @param res returns a 204 No Content response if the form is deleted successfully, or an error response if the deletion fails.
     */
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);
            await this.service.delete(formId, userId);
            res.status(StatusCodes.NO_CONTENT).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Updates a form.
     * @param req expects @user userId, @form formId
     * @param res
     */
    async put(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);

            const updatedForm = await this.service.put(
                req.body.data,
                userId,
                formId
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form updated successfully',
                data: updatedForm,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Updates a form and its sections and questions in a single transaction.
     * @param req expects @user userId, @form formId
     * @param res returns a 200 OK response with the updated form if the update is successful, or an error response if the update fails.
     */
    async bulkPut(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);

            const form = await this.service.bulkPut(
                req.body.data,
                userId,
                formId
            );

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form updated successfully',
                data: form,
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @description Updates a form.
     * @param req expects @user userId, @form formId
     * @param res returns a 200 OK response with the updated form if the update is successful, or an error response if the update fails.
     */
    async patch(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId, bodyData } = this.getRequestData(req);

            const updatedForm = await this.service.patch(
                bodyData,
                userId,
                formId
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form updated successfully',
                data: { form: updatedForm },
            });
        } catch (error) {
            next(error);
        }
    }

    async publish(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);
            const publishedForm = await this.service.publish(userId, formId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form published successfully',
                data: { form: publishedForm },
            });
        } catch (error) {
            next(error);
        }
    }

    async unPublish(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);
            const unpublishedForm = await this.service.unPublish(
                userId,
                formId
            );
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form unpublished successfully',
                data: { form: unpublishedForm },
            });
        } catch (error) {
            next(error);
        }
    }

    async duplicate(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);
            const duplicatedForm = await this.service.duplicate(userId, formId);
            res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Form duplicated successfully',
                data: { form: duplicatedForm },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Retrieves all forms for a user with pagination and optional filtering by last updated date.
     * @param req   expects query parameters `limit`, `page`, and `lastUpdated` for pagination and filtering.
     * @param res  returns a paginated list of forms for the user, or an empty list if no forms are found.
     */
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = this.getRequestData(req);
            const limit = Math.min(
                Math.max(
                    Number.parseInt(req.query.limit as string, 10) || 10,
                    1
                ),
                100
            );

            const page = Math.max(
                Number.parseInt(req.query.page as string, 10) || 1,
                1
            );

            let lastUpdated: Date | undefined;
            if (req.query.lastUpdated) {
                const parsedDate = new Date(req.query.lastUpdated as string);
                if (!Number.isNaN(parsedDate.getTime())) {
                    lastUpdated = parsedDate;
                }
            }

            const forms = await this.service.getAll(userId, {
                page,
                limit,
                lastUpdated,
            });

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Forms retrieved successfully',
                data: { forms },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default FormsController;
