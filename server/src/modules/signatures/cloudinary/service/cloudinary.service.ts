import config from '@/config';
import { AppError } from '@/utils/AppError';
import { v2 as cloudinary } from 'cloudinary';

interface UploadSignature {
    signature: string;
    api_key: string;
    cloud_name: string;

    timestamp: number;
    expires_at: number;

    cloudinary_timestamp: number;

    folder: string;
}

class CloudinaryService {
    private cachedSignature: UploadSignature | null = null;
    private cachedSignatureExpiry = 0;

    private signaturePromise: Promise<UploadSignature> | null = null;

    private readonly folder = config.cloudinary.named_folder;

    constructor() {
        const { cloud_name, api_key, api_secret } = config.cloudinary;

        if (!cloud_name || !api_key || !api_secret) {
            throw AppError.CLoudinaryConfigMissing(
                'Server is Busy. Please try again later.'
            );
        }

        cloudinary.config({
            cloud_name,
            api_key,
            api_secret,
        });
    }

    private async generateSignature(
        bucketTimestamp: number,
        expiresAt: number
    ): Promise<UploadSignature> {
        const cloudinaryTimestamp = Math.floor(bucketTimestamp / 1000);

        const paramsToSign = {
            timestamp: cloudinaryTimestamp,
            folder: this.folder,
        };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            config.cloudinary.api_secret
        );

        const result: UploadSignature = {
            signature,
            api_key: config.cloudinary.api_key,
            cloud_name: config.cloudinary.cloud_name,
            timestamp: bucketTimestamp,
            expires_at: expiresAt,
            cloudinary_timestamp: cloudinaryTimestamp,

            folder: this.folder,
        };

        this.cachedSignature = result;
        this.cachedSignatureExpiry = expiresAt;

        return result;
    }

    async getSignature(): Promise<UploadSignature> {
        const now = Date.now();

        const windowSize = config.cloudinary.window_expiration;
        const safetyBuffer = config.cloudinary.window_buffer;

        let bucketTimestamp = Math.floor(now / windowSize) * windowSize;

        let expiresAt = bucketTimestamp + windowSize;

        const remaining = expiresAt - now;

        if (remaining < safetyBuffer) {
            bucketTimestamp += windowSize;
            expiresAt += windowSize;
        }

        if (this.cachedSignature && this.cachedSignatureExpiry === expiresAt) {
            return this.cachedSignature;
        }

        if (this.signaturePromise) {
            return this.signaturePromise;
        }

        this.signaturePromise = this.generateSignature(
            bucketTimestamp,
            expiresAt
        ).finally(() => {
            this.signaturePromise = null;
        });

        return this.signaturePromise;
    }
}

export default new CloudinaryService();
