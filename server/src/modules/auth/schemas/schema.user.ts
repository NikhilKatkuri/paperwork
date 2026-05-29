import { UserDocument } from '@/types/user.types';
import mongoose, { Schema } from 'mongoose';

export const userSchema = new Schema<UserDocument>(
    {
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        isVerified: { type: Boolean, default: false },
        resetToken: { type: String, index: true, default: null },
        resetExpires: { type: Date, index: true, default: null },
    },
    {
        timestamps: true,
    }
);

userSchema.index({ resetToken: 1, resetExpires: 1 });
const UserModel = mongoose.model<UserDocument>('User', userSchema);

export default UserModel;
