import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import storage_buckets from '@/config';
import axios from 'axios';

export interface CloudinarySignature {
    signature: string;
    api_key: string;
    cloud_name: string;

    timestamp: number;
    expires_at: number;

    cloudinary_timestamp: number;

    folder: string;
}

type SignatureResult =
    { ok: true; data: CloudinarySignature } | { ok: false; error: string };

function isValidSignature(value: unknown): value is CloudinarySignature {
    if (!value || typeof value !== 'object') return false;

    const v = value as Record<string, unknown>;
    return (
        typeof v.signature === 'string' &&
        (typeof v.api_key === 'string' || typeof v.api_key === 'number') &&
        typeof v.cloud_name === 'string' &&
        typeof v.timestamp === 'number' &&
        typeof v.expires_at === 'number' &&
        typeof v.folder === 'string'
    );
}

export async function getCloudinarySignature(): Promise<SignatureResult> {
    if (typeof window !== 'undefined') {
        try {
            const cached = localStorage.getItem(storage_buckets.cloudinary);

            if (cached) {
                const parsed = JSON.parse(cached);

                // Ensure expires_at is converted to milliseconds if given in seconds
                const expiresAtMs =
                    parsed.expires_at < 1e11
                        ? parsed.expires_at * 1000
                        : parsed.expires_at;

                if (isValidSignature(parsed) && expiresAtMs > Date.now()) {
                    return { ok: true, data: parsed };
                }
            }
        } catch (error) {
            console.warn('Failed to read cached Cloudinary signature', error);
        }
    }

    // Fetch fresh signature
    try {
        const { path } = endpoints.signature.cloudinary;
        const res = await http.get<{ data: CloudinarySignature }>(path);

        const data = res.data?.data;

        if (!isValidSignature(data)) {
            return {
                ok: false,
                error: 'Received an invalid upload signature from the server.',
            };
        }

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(
                    storage_buckets.cloudinary,
                    JSON.stringify(data)
                );
            } catch (error) {
                console.warn('Failed to cache Cloudinary signature', error);
            }
        }

        return { ok: true, data };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;

            if (status === 401) {
                return {
                    ok: false,
                    error: 'You are not authorized to upload images.',
                };
            }

            if (status === 429) {
                return {
                    ok: false,
                    error: 'Too many requests. Please try again in a moment.',
                };
            }

            return {
                ok: false,
                error:
                    error.response?.data?.message ??
                    error.message ??
                    'Failed to get upload signature.',
            };
        }

        return {
            ok: false,
            error: 'An unexpected error occurred while preparing the upload.',
        };
    }
}

export async function uploadToCloudinary(file: File) {
    try {
        const sig = await getCloudinarySignature();
        if (!sig.ok) {
            throw new Error(sig.error);
        }

        const signature = sig.data;
        const formData = new FormData();

        formData.append('file', file);
        formData.append('api_key', String(signature.api_key));
        formData.append('timestamp', String(signature.cloudinary_timestamp));
        formData.append('signature', signature.signature);
        formData.append('folder', signature.folder);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                ok: false,
                error: data.error?.message || 'Failed to upload image.',
            };
        }

        return {
            ok: true,
            url: data.secure_url,
            publicId: data.public_id,
        };
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Unexpected upload error.',
        };
    }
}
