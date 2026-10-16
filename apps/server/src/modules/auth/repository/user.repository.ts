import AutoBoundClass from '@/utils/AutoBoundClass';
import UserModel from '@/modules/auth/schemas/user.schema';
import { UpdateQuery } from 'mongoose';
import { MongooseDocument } from '@/types';
import { User } from '@paperwork/types';

class UserRepository<
    T extends object = MongooseDocument<User>,
> extends AutoBoundClass {
    constructor() {
        super();
    }

    findUserById = async (userId: string, select?: string) => {
        const query = UserModel.findById(userId);
        if (select && select.trim()) query.select(select);
        return await query;
    };

    findUserByEmail = async (email: string, includeHash = false) => {
        const query = UserModel.findOne({ email: email.toLowerCase().trim() });
        if (includeHash) query.select('+passwordHash');
        return await query;
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
            runValidators: true,
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
                    resetToken: '',
                    resetExpires: '',
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
