import { UserDocument } from "@/modules/auth/types/user.auth";
import mongoose, { Schema } from "mongoose";
import {
  userAccountDeactivationStatus,
  userAccountDeletedStatus,
} from "../constants/enums";

export const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    resetToken: { type: String, index: true, default: null },
    resetExpires: { type: Date, index: true, default: null },
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
  },
);

userSchema.index({ resetToken: 1, resetExpires: 1 });
const UserModel = mongoose.model<UserDocument>("User", userSchema);

export default UserModel;
