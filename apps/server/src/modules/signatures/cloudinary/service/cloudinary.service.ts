import config from '@/config';
import { AppError } from '@/utils/AppError';
import { createServiceLogger, logError } from '@/utils/logger';
import { v2 as cloudinary } from 'cloudinary';
import ProfileRepoBoot from '@/modules/auth/repository/profile.repository';
import { extractCloudinaryPublicId } from '../utils/cloudinary.asset';
import avatarCleanupOutboxService from './avatarCleanupOutbox.service';

/**
 * Canonical Cloudinary lifecycle event names, mirroring the security-audit
 * convention: emitted at the decision site with the fields needed to act on
 * the line (the `publicId` of a failed cleanup is what an operator retries).
 */
export const CLOUDINARY_EVENTS = {
    /** A previous avatar could not be proven to be an owned asset (or is
     * still the one the profile references) and was left alone. */
    AVATAR_CLEANUP_SKIPPED: 'CLOUDINARY_AVATAR_CLEANUP_SKIPPED',
    /** Inline deletion failed and a durable retry job was persisted. */
    AVATAR_CLEANUP_QUEUED: 'CLOUDINARY_AVATAR_CLEANUP_QUEUED',
    /** Deletion failed and could not even be queued; manual cleanup. */
    AVATAR_CLEANUP_FAILED: 'CLOUDINARY_AVATAR_CLEANUP_FAILED',
    /** A background retry deleted the asset. */
    AVATAR_CLEANUP_DONE: 'CLOUDINARY_AVATAR_CLEANUP_DONE',
    /** A background retry attempt failed; another may follow. */
    AVATAR_CLEANUP_ATTEMPT_FAILED: 'CLOUDINARY_AVATAR_CLEANUP_ATTEMPT_FAILED',
    /** Retries exhausted; the asset is orphaned and needs manual cleanup. */
    AVATAR_CLEANUP_EXHAUSTED: 'CLOUDINARY_AVATAR_CLEANUP_EXHAUSTED',
} as const;

export const cloudinaryLogger = createServiceLogger('cloudinary');

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

    private generateSignature(
        bucketTimestamp: number,
        expiresAt: number
    ): UploadSignature {
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

    getSignature(): UploadSignature {
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
            // Refresh the cached object if the window rolled over but the
            // expiry coincidentally matches (clock skew): regenerate when
            // less than the safety buffer remains.
            if (expiresAt - Date.now() > 0) {
                return this.cachedSignature;
            }
        }

        return this.generateSignature(bucketTimestamp, expiresAt);
    }

    /**
     * Deletes one asset from the configured Cloudinary account.
     *
     * Resolves when the asset is gone — `not found` counts, since a
     * concurrent update may have removed it already — and throws when
     * destruction could not be confirmed, so callers can queue a retry or
     * log the cause.
     */
    async destroyAsset(publicId: string): Promise<void> {
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok' || result.result === 'not found') return;

        throw new Error(
            `Cloudinary destroy returned "${result.result}" for ${publicId}`
        );
    }

    /**
     * Destroys the Cloudinary asset that backed a profile avatar before the
     * profile was updated to a new one. The previous asset is identified by
     * extracting its public id from the stored URL.
     *
     * Called only after the database already references the new avatar, so
     * this method must never throw: a failed inline attempt is handed to the
     * durable cleanup outbox (retried in the background) and the successful
     * profile update is preserved.
     *
     * Safety rules enforced here:
     * - only assets inside the configured folder are ever destroyed;
     * - URLs that do not provably point at an owned asset are skipped;
     * - the asset the profile currently references is never deleted.
     */
    async cleanupReplacedAsset(input: {
        userId: string;
        previousUrl?: string | null;
        currentUrl?: string | null;
    }): Promise<void> {
        const scope = {
            cloudName: config.cloudinary.cloud_name,
            folder: config.cloudinary.named_folder,
        };
        const { userId, previousUrl, currentUrl } = input;

        const publicId = extractCloudinaryPublicId(previousUrl, scope);

        if (!publicId) {
            if (previousUrl) {
                cloudinaryLogger.warn('cloudinary: previous avatar skipped', {
                    event: CLOUDINARY_EVENTS.AVATAR_CLEANUP_SKIPPED,
                    reason: 'public_id_not_derivable',
                    userId,
                });
            }
            return;
        }

        if (publicId === extractCloudinaryPublicId(currentUrl, scope)) return;

        // A stored delivery URL may have been shared by another profile.
        // Refusing to delete is the only safe direction: an orphaned asset
        // costs storage, deleting a referenced one breaks someone's avatar.
        if (await ProfileRepoBoot.isAvatarAssetReferenced(publicId)) {
            cloudinaryLogger.warn('cloudinary: previous avatar skipped', {
                event: CLOUDINARY_EVENTS.AVATAR_CLEANUP_SKIPPED,
                reason: 'referenced_by_another_profile',
                userId,
                publicId,
            });
            return;
        }

        try {
            await this.destroyAsset(publicId);
        } catch (error) {
            await this.queueCleanupRetry({ userId, publicId, error });
        }
    }

    /**
     * Persists a durable background retry for an asset whose inline
     * deletion failed. Never throws: even a queueing failure only leaves a
     * structured log line behind, because the profile update already
     * succeeded and must not be undone.
     */
    private async queueCleanupRetry(input: {
        userId: string;
        publicId: string;
        error: unknown;
    }): Promise<void> {
        try {
            await avatarCleanupOutboxService.enqueue(input);

            logError(
                cloudinaryLogger,
                'cloudinary: avatar cleanup queued for background retry',
                input.error,
                {
                    event: CLOUDINARY_EVENTS.AVATAR_CLEANUP_QUEUED,
                    userId: input.userId,
                    publicId: input.publicId,
                }
            );
        } catch (enqueueError) {
            logError(
                cloudinaryLogger,
                'cloudinary: avatar cleanup could not be queued',
                enqueueError,
                {
                    event: CLOUDINARY_EVENTS.AVATAR_CLEANUP_FAILED,
                    reason: 'enqueue_failed',
                    userId: input.userId,
                    publicId: input.publicId,
                    destroyError:
                        input.error instanceof Error
                            ? input.error.message
                            : String(input.error),
                }
            );
        }
    }
}

export default new CloudinaryService();
