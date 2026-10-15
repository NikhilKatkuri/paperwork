import AutoBoundClass from '@/utils/AutoBoundClass';
import UserModel from '@/modules/auth/schemas/user.schema';
import { User, UserDocument } from '../types/user.auth';
import { UpdateQuery } from 'mongoose';

class UserRepository<T extends object = UserDocument> extends AutoBoundClass {
    constructor() {
        super();
    }

    findUserById = async (userId: string, select: string = ' ') => {
        return await UserModel.findById(userId).select(select);
    };

    findUserByEmail = async (email: string) => {
        return await UserModel.findOne({ email });
    };

    clearDeletionFlag = async (userId: string) => {
        return (await UserModel.findByIdAndUpdate(
            userId,
            {
                $unset: {
                    accountDeletedStatus: '',
                    accountDeactivationStatus: '',
                    accountDeleteRequestedAt: '',
                    accountWillbeDeletedAt: '',
                },
            },
            {
                returnDocument: 'after',
                lean: true,
            }
        )) as unknown as T | null;
    };

    findUserByIdAndUpdateFeilds = async (
        userId: string,
        feilds: UpdateQuery<T>,
        selectedFields: string | Record<string, 1 | 0> = {}
    ): Promise<T | null> => {
        return (await UserModel.findByIdAndUpdate(userId, feilds, {
            returnDocument: 'after',
            lean: true,
            select: selectedFields,
        })) as unknown as T | null;
    };

    async createUser(user: Pick<User, 'email' | 'passwordHash'>): Promise<T> {
        const newUser = new UserModel(user);
        const savedUser = await newUser.save();
        return savedUser.toObject() as unknown as T;
    }

    async clearResets(userId: string) {
        return await UserModel.findByIdAndUpdate(
            userId,
            {
                $unset: {
                    resetPasswordToken: undefined,
                    resetPasswordExpires: undefined,
                },
            },
            {
                returnDocument: 'after',
                lean: true,
            }
        );
    }
}

const UserRepoBoot = new UserRepository();

export default UserRepoBoot;
