import {
    UserAccountDeactivationStatus,
    UserAccountDeletedStatus,
} from '@/modules/auth/constants/enums';
import { Document } from 'mongoose';

export interface Security {
    accountDeletedStatus?: UserAccountDeletedStatus;
    accountDeactivationStatus?: UserAccountDeactivationStatus;
    twofactorEnabled?: boolean;
    accountDeleteRequestedAt?: Date;
    accountWillbeDeletedAt?: Date;
}

export interface User extends Security {
    email: string;
    passwordHash: string;
    isVerified: boolean;
    resetToken?: string;
    resetExpires?: Date;
}

export type UserDocument = User & Document;

export type RequestMeta = {
    ip: string | null;
    location: {
        city?: string;
        region?: string;
        country?: string;
        ll?: [number, number];
        timezone?: string;
    } | null;
    device: {
        family?: string;
        brand?: string;
        model?: string;
        type?: string;
    } | null;
    browser: {
        family?: string;
        version?: string;
    } | null;
    os: {
        family?: string;
        version?: string;
    } | null;
    userAgentRaw: string | null;
};
