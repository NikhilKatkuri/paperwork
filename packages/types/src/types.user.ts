import {
    UserAccountDeactivationStatus,
    UserAccountDeletedStatus,
} from './constants/enums';

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
