import { Country, Gender, Language } from '@/features/settings/constants/enums';
import { FormDto } from '@paperwork/types';

export interface sensitiveData {
    dob: Date;
    gender: Gender;
    country: Country;
    language: Language;
}

export default interface Profile extends PublicProfile {
    sensitiveData?: sensitiveData;
}

export interface PublicProfile {
    readonly userId: string;
    fullName: string;
    avatarUrl: string;
    bio?: string;
}

export interface CacheProfile extends Omit<Profile, 'sensitiveData'> {
    storedAt: number;
}

export interface LocalDocument {
    isDirty: boolean;
    lastSyncedAt: string | null;
}

export interface FormDB extends FormDto, LocalDocument {}

export type Tabs = 'questions' | 'settings' | 'responses';