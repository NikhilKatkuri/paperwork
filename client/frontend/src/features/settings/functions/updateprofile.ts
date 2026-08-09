import { endpoints } from '@/api/endpoints';
import { getErrorMessage } from '@/api/error';
import { http } from '@/api/http';
import { PublicProfile, sanitizeProfile } from '@/common/profile.common';
import storage_buckets from '@/config';
import Profile, { CacheProfile } from '@/types';
import axios from 'axios';
import { useState } from 'react';
import { uploadToCloudinary } from './cloudinary.signature';

type UpdateProfileResult =
    { ok: true; profile: PublicProfile } | { ok: false; error: string };

function isProfilePictureUrlChanged(
    original: PublicProfile,
    updated: PublicProfile
): boolean {
    return original.avatarUrl === updated.avatarUrl;
}

function useProfileUpdate() {
    const [loading, setLoading] = useState(false);

    const handler = async <T extends Profile>(
        profile: Profile,
        mutator: (data: T) => void,
        rawFile: File | null,
        original: PublicProfile | null
    ): Promise<UpdateProfileResult> => {
        setLoading(true);
        console.log('Original profile:', original);
        try {
            let updatedAvatarUrl = profile.avatarUrl;
            const isDefOriginal =
                original !== null &&
                typeof original === 'object' &&
                'avatarUrl' in original &&
                rawFile !== null &&
                typeof rawFile === 'object';
            console.log('Is original profile defined:', isDefOriginal);
            if (
                isDefOriginal &&
                isProfilePictureUrlChanged(original, profile)
            ) {
                console.log('Uploading new profile picture to Cloudinary...');
                const upToCld = await uploadToCloudinary(rawFile!);
                console.log('Cloudinary upload result:', upToCld);
                if (upToCld.ok) {
                    console.log('Original profile:', upToCld);
                    updatedAvatarUrl = upToCld.url;
                }
            }

            const payload = {
                ...profile,
                avatarUrl: updatedAvatarUrl,
            };
            console.log('Payload for profile update:', payload);
            const { path } = endpoints.auth.me;

            console.log('Sending profile update request to server...');
            const res = await http.post<{
                ok: boolean;
                profile: Profile;
            }>(path, payload);
            console.log('Profile update response:', res);
            if (res.status !== 200) {
                console.log(
                    'Server responded with an error during profile update:',
                    res.data
                );
                return {
                    ok: false,
                    error: 'Failed to update profile.',
                };
            }
            console.log(
                'Profile updated successfully on server:',
                res.data.profile
            );
            const sanitized = sanitizeProfile(res.data.profile);
            console.log('Sanitized profile:', sanitized);

            console.log('Saving updated profile to cache...');
            handleCacheSave(sanitized);
            console.log('Updated profile saved to cache successfully.');
            mutator(sanitized as T);
            console.log('Profile update process completed successfully.');
            return {
                ok: true,
                profile: sanitized,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return {
                    ok: false,
                    error: getErrorMessage(
                        error.response?.status,
                        error.response?.data
                    ),
                };
            }

            return {
                ok: false,
                error: 'An unexpected error occurred.',
            };
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        updateProfile: handler,
    };
}

function handleCacheSave(profile: PublicProfile) {
    console.log('Saving profile to cache:', profile);
    const updated: CacheProfile = {
        ...profile,
        storedAt: Date.now(),
    };
    console.log('Updated cache profile:', updated);
    try {
        localStorage.setItem(storage_buckets.profile, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save profile cache:', error);
    }
}

export { handleCacheSave };
export default useProfileUpdate;
