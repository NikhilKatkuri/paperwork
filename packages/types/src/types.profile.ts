import { Country, Gender, Language } from './constants/enums';

export interface SensitiveData {
    dob: Date;
    gender: Gender;
    country: Country;
    language: Language;
}

export interface Profile<T> {
    readonly userId: T;
    fullName: string;
    avatarUrl?: string;
    bio?: string;
    sensitiveData?: SensitiveData;
}
