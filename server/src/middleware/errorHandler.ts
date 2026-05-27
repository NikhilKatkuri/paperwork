import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/utils/AppError';
import config from '@/config'; // Make sure you import your environment config

const globalErrorHandler = (
    error: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    let message = error.message || 'Internal Server Error';
    let errors: any = undefined;

    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        if ('errors' in error) {
            errors = (error as any).errors;
        }
    } else if (error.name === 'CastError') {
        statusCode = StatusCodes.BAD_REQUEST;
        message = `Invalid format for field: ${error.path}`;
    } else {
        console.error('[Internal Error Stack]:', error);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
        ...(config.env === 'development' && { stack: error.stack }),
    });
};

export default globalErrorHandler;
