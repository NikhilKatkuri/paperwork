import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
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
    static FormNotPublished(message: string) {
        return new AppError(StatusCodes.BAD_REQUEST, message);
    }
    static FormClosed(message: string) {
        return new AppError(StatusCodes.BAD_REQUEST, message);
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
    static QuestionUpdateFailed(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
    static FormDeletionFailed(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
    static SectionReorderFailed(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
    static SectionUpdateFailed(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
    static NotImplemented(message: string) {
        return new AppError(StatusCodes.NOT_IMPLEMENTED, message);
    }
    static Forbidden(message: string) {
        return new AppError(StatusCodes.FORBIDDEN, message);
    }
    static FormNotOpen(message: string) {
        return new AppError(StatusCodes.BAD_REQUEST, message);
    }
    static MaxResponseLimitReached(message: string) {
        return new AppError(StatusCodes.BAD_REQUEST, message);
    }
    static ResponseNotFound(message: string) {
        return new AppError(StatusCodes.NOT_FOUND, message);
    }
    static Internal(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }

    static CLoudinaryConfigMissing(message: string) {
        return new AppError(StatusCodes.INTERNAL_SERVER_ERROR, message);
    }
}

export class SystemError extends Error {
    public readonly loc: string;
    public readonly isOperational: boolean;

    constructor(loc: string, message: string) {
        super(message);
        this.loc = loc;
        this.isOperational = false;

        Object.setPrototypeOf(this, SystemError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
