import { ProfileDocument } from '@/types/profile.types';
import mongoose, { Schema } from 'mongoose';

export const profileSchema = new Schema<ProfileDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        fullName: { type: String, required: true },
        avatarUrl: { type: String },
        bio: { type: String },
    },
    {
        timestamps: true,
    }
);
profileSchema.set('toObject', {
    transform: (_, ret) => {
        Reflect.deleteProperty(ret, '__v');
        if (!ret.avatarUrl) delete ret.avatarUrl;
        if (!ret.bio) delete ret.bio;
        return ret;
    },
});
const ProfileModel = mongoose.model<ProfileDocument>('Profile', profileSchema);

export default ProfileModel;
