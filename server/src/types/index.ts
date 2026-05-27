import { Request } from 'express';

export interface CustomAuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}
