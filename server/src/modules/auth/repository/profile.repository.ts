import AutoBoundClass from '@/utils/AutoBoundClass';
import ProfileModel from '@/modules/auth/schemas/profile.schema';
import { Profile, ProfileDocument } from '../types/profile.auth';

class ProfileRepository<
    T extends object = ProfileDocument,
> extends AutoBoundClass {
    constructor() {
        super();
    }

    async findByUserId(
        userId: string,
        selectFields: string = ''
    ): Promise<T | null> {
        return (await ProfileModel.findOne({ userId })
            .select(selectFields)
            .lean()) as T | null;
    }

    async createProfile(userId: string): Promise<T> {
        const docs = await ProfileModel.create([{ userId }], {
            validateBeforeSave: true,
        });
        return docs[0]!.toObject() as unknown as T;
    }

    async updateProfile<P>(
        userId: string,
        updateData: Partial<
            Exclude<P, Profile['sensitiveData'] | Profile['userId']>
        >
    ): Promise<P | null> {
        const updatedProfile = await ProfileModel.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { returnDocument: 'after', runValidators: true }
        ).lean();

        return updatedProfile as P | null;
    }
}

const ProfileRepoBoot = new ProfileRepository();

export default ProfileRepoBoot;
