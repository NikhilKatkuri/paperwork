import { Document } from 'mongoose';

export interface User {
    email: string;
    passwordHash: string;
    isVerified: boolean;
}

export type UserDocument = User & Document;
