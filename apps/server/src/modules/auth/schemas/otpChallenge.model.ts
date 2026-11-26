import mongoose, { Schema } from 'mongoose';

export interface OtpChallenge {
    key: string;
    expiresAt: Date;
    attempts: number;
    consumed: boolean;
}

const otpChallengeSchema = new Schema<OtpChallenge>(
    {
        key: { type: String, required: true, unique: true, index: true },
        expiresAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
        consumed: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false }
);

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpChallengeModel = mongoose.model<OtpChallenge>(
    'OtpChallenge',
    otpChallengeSchema
);

export default OtpChallengeModel;
