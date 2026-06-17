import {
    UserAccountDeactivationStatus,
    UserAccountDeletedStatus,
} from '@/modules/auth/constants/enums';
import { Document } from 'mongoose';

export interface Security {
    accountDeletedStatus?: UserAccountDeletedStatus | undefined;
    accountDeactivationStatus?: UserAccountDeactivationStatus | undefined;
    twofactorEnabled?: boolean | undefined;
    accountDeleteRequestedAt?: Date | undefined;
    accountWillbeDeletedAt?: Date | undefined;
}

export interface User extends Security {
    email: string;
    passwordHash: string;
    isVerified: boolean;
    resetToken?: string | undefined;
    resetExpires?: Date | undefined;
}

export type UserDocument = User & Document;
