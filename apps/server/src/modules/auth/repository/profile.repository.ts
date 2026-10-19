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

    /**
     * True when any profile still references the given Cloudinary asset id
     * in its avatar URL. The match targets the asset id (last path segment)
     * rather than an exact URL, because `avatarUrl` stores delivery URLs and
     * the same asset can be referenced with different transformations.
     * Erring toward "referenced" only ever leaves an unused asset in
     * storage; deleting a referenced one breaks a different user's profile.
     */
    async isAvatarAssetReferenced(publicId: string): Promise<boolean> {
        const assetId = publicId.split('/').pop();
        if (!assetId) return false;

        const escaped = assetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const found = await ProfileModel.exists({
            avatarUrl: new RegExp(escaped),
        });

        return found !== null;
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
