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
}
