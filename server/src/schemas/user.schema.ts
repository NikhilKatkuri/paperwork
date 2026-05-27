import { UserDocument } from '@/types/user.types';
import mongoose, { Schema } from 'mongoose';

export const userSchema = new Schema<UserDocument>(
    {
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const UserModel = mongoose.model<UserDocument>('User', userSchema);

export default UserModel;
