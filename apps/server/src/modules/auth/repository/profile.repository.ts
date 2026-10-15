import AutoBoundClass from '@/utils/AutoBoundClass';
import ProfileModel from '@/modules/auth/schemas/profile.schema';
import { MongooseDocument } from '@/types';
import { Profile } from '@paperwork/types';
import mongoose from 'mongoose';

class ProfileRepository<
    T extends object = MongooseDocument<Profile<mongoose.Types.ObjectId>>,
> extends AutoBoundClass {
    constructor() {
        super();
    }

    async findByUserId(
        userId: string,
        selectFields: Record<string, 1 | 0> = {}
    ): Promise<T | null> {
        return (await ProfileModel.findOne({ userId }).select(
            selectFields
        )) as T | null;
    }

    async createProfile(userId: string): Promise<T> {
        const doc = new ProfileModel({ userId });
        await doc.save({ validateBeforeSave: true });
        return doc.toObject() as unknown as T;
    }

    async updateProfile(
        userId: string,
        updateData: Record<string, any>,
        selectFields: Record<string, 1 | 0> = {}
    ): Promise<T | null> {
        const updatedProfile = await ProfileModel.findOneAndUpdate(
            { userId },
            updateData,
            { returnDocument: 'after', runValidators: true }
        ).select(selectFields);

        return updatedProfile as T | null;
    }
}

const ProfileRepoBoot = new ProfileRepository();

export default ProfileRepoBoot;
