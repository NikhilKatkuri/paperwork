import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
    static SectionReorderFailed(arg0: string) {
          throw new Error('Method not implemented.');
    }
    static SectionUpdateFailed(arg0: string) {
          throw new Error('Method not implemented.');
    }
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(statusCode: number, message: string) {
        super(message);

        this.statusCode = statusCode;
        this.isOperational = true;

        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }

    static Conflict(message: string) {
        return new AppError(StatusCodes.CONFLICT, message);
    }

    static Unauthorized(message: string) {
        return new AppError(StatusCodes.UNAUTHORIZED, message);
    }

    static NotFound(message: string) {
        return new AppError(StatusCodes.NOT_FOUND, message);
    }
    static BadRequest(message: string) {
        return new AppError(StatusCodes.BAD_REQUEST, message);
    }
    static FormCreationFailed(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
    static FormNotFound(message: string) {
        return new AppError(StatusCodes.NOT_FOUND, message);
    }
    static FormPublishFailed(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
    static SectionCreationFailed(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
    static SectionDeletionFailed(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
    static SectionNotFound(message: string) {
        return new AppError(StatusCodes.NOT_FOUND, message);
    }
    static QuestionCreationFailed(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
    static QuestionNotFound(message: string) {
        return new AppError(StatusCodes.NOT_FOUND, message);
    }
}
