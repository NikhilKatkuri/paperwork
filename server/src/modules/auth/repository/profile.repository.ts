import AutoBoundClass from '@/utils/AutoBoundClass';
import ProfileModel from '@/modules/auth/schemas/profile.schema';
import { ProfileDocument } from '../types/profile.auth';

class ProfileRepository<
    T extends object = ProfileDocument,
> extends AutoBoundClass {
    constructor() {
        super();
    }

    async findByUserId(
        userId: string,
        selectFields: Record<string, 1 | 0> = {}
    ): Promise<T | null> {
        return (await ProfileModel.findOne({ userId })
            .select(selectFields)
            .lean()) as T | null;
    }

    async createProfile(userId: string): Promise<T> {
        const doc = new ProfileModel({ userId });
        await doc.save({ validateBeforeSave: true });
        return doc.toObject() as unknown as T;
    }

    async updateProfile<P = any>(
        userId: string,
        updateData: Record<string, any>,
        selectFields: Record<string, 1 | 0> = {}
    ): Promise<P | null> {
        const updatedProfile = await ProfileModel.findOneAndUpdate(
            { userId },
            updateData,
            { returnDocument: 'after', runValidators: true }
        )
            .select(selectFields)
            .lean();

        return updatedProfile as P | null;
    }
}

const ProfileRepoBoot = new ProfileRepository();

export default ProfileRepoBoot;
