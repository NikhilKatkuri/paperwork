import { Document, Types } from 'mongoose';

export interface Profile {
    readonly userId: Types.ObjectId;
    fullName: string;
    avatarUrl?: string;
    bio?: string;
}

export type ProfileDocument = Profile & Document;
