import mongoose, { Schema } from 'mongoose';
import {
    userAccountDeactivationStatus,
    userAccountDeletedStatus,
    User,
} from '@paperwork/types';
import { MongooseDocument } from '@/types';
import transform from '@/schemas/tranformer';

export const userSchema = new Schema<MongooseDocument<User>>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        passwordHash: { type: String, required: true, select: false },
        isVerified: { type: Boolean, default: false },
        resetToken: { type: String, index: true, default: null, select: false },
        resetExpires: { type: Date, index: true, default: null, select: false },
        accountDeletedStatus: {
            type: String,
            enum: Object.values(userAccountDeletedStatus),
            default: null,
        },
        accountDeactivationStatus: {
            type: String,
            enum: Object.values(userAccountDeactivationStatus),
            default: null,
        },
        accountDeleteRequestedAt: { type: Date, default: null },
        accountWillbeDeletedAt: { type: Date, default: null },
        twofactorEnabled: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

userSchema.index({ resetToken: 1, resetExpires: 1 });
userSchema.index({ accountDeleteRequestedAt: 1, accountWillbeDeletedAt: 1 });

userSchema.set('toJSON', { transform });
const UserModel = mongoose.model<MongooseDocument<User>>('User', userSchema);

export default UserModel;
