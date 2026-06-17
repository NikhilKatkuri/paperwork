import { ProfileDocument, SensitiveDocument } from '../types/profile.auth';
import mongoose, { Schema } from 'mongoose';
import { GENDERS, COUNTRIES, LANGUAGES } from '../constants/enums';

const sensitiveSchema = new Schema<SensitiveDocument>(
    {
        dob: {
            type: Date,
        },
        gender: {
            type: String,
            enum: [...Object.values(GENDERS)],
        },
        country: {
            type: String,
            enum: [...Object.values(COUNTRIES)],
        },
        language: {
            type: String,
            enum: [...Object.values(LANGUAGES)],
        },
    },
    {
        timestamps: false,
        _id: false,
    }
);

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
        sensitiveData: {
            type: sensitiveSchema,
            required: false,
            default: null,
        },
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
