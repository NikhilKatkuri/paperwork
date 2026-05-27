import { Document } from 'mongoose';

export interface User {
    email: string;
    passwordHash: string;
}

export type UserDocument = User & Document;
