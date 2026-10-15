import mongoose, { Schema } from 'mongoose';
import {
    GENDERS,
    COUNTRIES,
    LANGUAGES,
    Profile,
    SensitiveData,
} from '@paperwork/types';
import { MongooseDocument } from '@/types';
import transform from '@/schemas/tranformer';

const sensitiveSchema = new Schema<MongooseDocument<SensitiveData>>(
    {
        dob: {
            type: Date,
        },
        gender: {
            type: String,
            enum: Object.values(GENDERS),
        },
        country: {
            type: String,
            enum: Object.values(COUNTRIES),
        },
        language: {
            type: String,
            enum: Object.values(LANGUAGES),
        },
    },
    {
        timestamps: false,
        _id: false,
    }
);

export const profileSchema = new Schema<
    MongooseDocument<Profile<mongoose.Types.ObjectId>>
>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true,
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

const transformProfile = (_: any, ret: any) => {
    if (ret.avatarUrl == null || ret.avatarUrl === '') delete ret.avatarUrl;
    if (ret.bio == null || ret.bio === '') delete ret.bio;
    return transform(_, ret);
};

profileSchema.set('toObject', {
    transform: transformProfile,
});

profileSchema.set('toJSON', { transform: transformProfile });

const ProfileModel =
    (mongoose.models.Profile as mongoose.Model<
        MongooseDocument<Profile<mongoose.Types.ObjectId>>
    >) ||
    mongoose.model<MongooseDocument<Profile<mongoose.Types.ObjectId>>>(
        'Profile',
        profileSchema
    );

export default ProfileModel;
