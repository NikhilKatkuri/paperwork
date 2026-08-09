import { Document, Types } from 'mongoose';
import { Country, Gender, Language } from '../constants/enums';

export interface sensitiveData {
    dob: Date;
    gender: Gender;
    country: Country;
    language: Language;
}

export interface Profile {
    readonly userId: Types.ObjectId;
    fullName: string;
    avatarUrl?: string;
    bio?: string;
    sensitiveData?: sensitiveData;
}

export type ProfileDocument = Profile & Document;
export type SensitiveDocument = sensitiveData & Document;
