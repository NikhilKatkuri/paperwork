import { Document } from 'mongoose';

export interface User {
    email: string;
    passwordHash: string;
    isVerified: boolean;
    resetToken?: string | undefined;
    resetExpires?: Date | undefined;
}

export type UserDocument = User & Document;
