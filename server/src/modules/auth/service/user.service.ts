import HashBoot from './hash.service';
import UserModel from '../schemas/user.schema';
import ProfileModel from '../schemas/profile.schema';
import { AppError } from '@/utils/AppError';
import {
    userAccountDeactivationStatus,
    userAccountDeletedStatus,
} from '../constants/enums';
import { AccountActionService } from '../types/auth.types';
import { sensitiveData } from '../types/profile.auth';

class UserService {
    private accountDeletionPeriodInDays = 30 * 24 * 60 * 60 * 1000;

    constructor() {
        const methods = Object.getOwnPropertyNames(
            UserService.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    /**
     * Performs account-related actions for a user.
     *
     * @param data
     * @param userId
     * @returns the result of the operation
     */
    async account(
        data: AccountActionService,
        userId: string
    ): Promise<{ success: boolean; message: string }> {
        const { action, password } = data;
        try {
            const user = await UserModel.findById(userId).select(
                '+passwordHash +accountDeletedStatus +accountDeactivationStatus +twofactorEnabled'
            );

            if (!user) {
                throw AppError.Unauthorized('Invalid credentials or request');
            }

            const isPasswordValid = await HashBoot.verifyHash(
                password,
                user.passwordHash
            );

            if (!isPasswordValid) {
                throw AppError.Unauthorized('Invalid credentials or request');
            }

            switch (action) {
                case 'delete-account':
                    if (
                        user.accountDeletedStatus ===
                        userAccountDeletedStatus.DELETED
                    ) {
                        throw AppError.BadRequest('Account action unavailable');
                    }
                    break;

                case 'deactivate-account':
                    if (
                        user.accountDeactivationStatus ===
                        userAccountDeactivationStatus.DEACTIVATED
                    ) {
                        throw AppError.BadRequest('Account action unavailable');
                    }
                    break;

                case 'enable-2fa':
                    if (user.twofactorEnabled === true) {
                        throw AppError.BadRequest('Account action unavailable');
                    }
                    break;

                case 'disable-2fa':
                    if (user.twofactorEnabled === false) {
                        throw AppError.BadRequest('Account action unavailable');
                    }
                    break;

                default:
                    throw AppError.BadRequest('Invalid API');
            }

            const objectToUpdate = {
                'delete-account': {
                    accountDeletedStatus: userAccountDeletedStatus.DELETED,
                    accountDeleteRequestedAt: new Date(),
                    accountWillbeDeletedAt: new Date(
                        Date.now() + this.accountDeletionPeriodInDays
                    ),
                    accountDeactivationStatus: undefined,
                },
                'deactivate-account': {
                    accountDeactivationStatus:
                        userAccountDeactivationStatus.DEACTIVATED,
                },
                'enable-2fa': { twofactorEnabled: true },
                'disable-2fa': { twofactorEnabled: false },
            };

            try {
                await UserModel.findByIdAndUpdate(
                    userId,
                    objectToUpdate[action],
                    {
                        returnDocument: 'after',
                    }
                );
                return {
                    success: true,
                    message: `Account ${action} successful`,
                };
            } catch (error) {
                throw AppError.Internal('Failed to update user account');
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw AppError.Internal('An unexpected error occurred');
        }
    }

    /**
     * Performs actions related to a user's personal information, such as adding or updating sensitive data.
     *
     * @param data
     * @param userId
     * @param method
     * @returns the result of the operation
     */
    async PersonalInfo(
        data: sensitiveData,
        userId: string,
        method: 'add' | 'update' = 'add'
    ): Promise<{ success: boolean; message: string }> {
        try {
            const profile = await ProfileModel.findOne({ userId });

            if (!profile) {
                throw AppError.NotFound('Profile not found');
            }

            if (method === 'update') {
                if (!profile.sensitiveData) {
                    profile.sensitiveData = {} as sensitiveData;
                }

                Object.assign(profile.sensitiveData, data);
            } else {
                profile.sensitiveData = data;
            }

            profile.markModified('sensitiveData');

            try {
                await profile.save();
                return {
                    success: true,
                    message:
                        method === 'update'
                            ? 'Updated successfully'
                            : 'Added successfully',
                };
            } catch (error) {
                throw AppError.Internal('Failed to save profile changes');
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw AppError.Internal('An unexpected error occurred');
        }
    }

    /**
     * Retrieves the personal information of a user based on their user ID.
     *
     * @param userId
     * @returns the sensitive personal information of the user, or null if not found
     */
    async getPersonalInfo(userId: string) {
        try {
            const profile = await ProfileModel.findOne({ userId })
                .select('+sensitiveData -_id')
                .lean();

            if (!profile) {
                throw AppError.NotFound('Profile not found');
            }

            return profile.sensitiveData ?? null;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw AppError.Internal('An unexpected error occurred');
        }
    }
}

const UserServiceBoot = new UserService();

export default UserServiceBoot;
