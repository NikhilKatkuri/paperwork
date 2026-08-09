import { endpoints } from '@/api/endpoints';
import { getErrorMessage } from '@/api/error';
import { http } from '@/api/http';
import { ProfileResult, sanitizeProfile } from '@/common/profile.common';
import storage_buckets from '@/config';
import Profile, { CacheProfile } from '@/types';
import axios from 'axios';
import { toast } from 'sonner';

function isProfileExpired(storedAt: number): boolean {
    const expiryTime = 24 * 60 * 60 * 1000;
    return Date.now() - storedAt > expiryTime;
}

export function getCachedProfile(): CacheProfile | null {
    try {
        const cache = localStorage.getItem(storage_buckets.profile);
        const userProfiles: CacheProfile = cache ? JSON.parse(cache) : null;
        const cached = userProfiles ?? null;

        if (cached && !isProfileExpired(cached.storedAt)) {
            return cached;
        }

        return null;
    } catch {
        return null;
    }
}

export function clearCachedProfile(): void {
    localStorage.removeItem(storage_buckets.profile);
}

const fromServer = async (): Promise<ProfileResult> => {
    const { path } = endpoints.auth.me;

    try {
        const res = await http.get<{ profile: Profile }>(path);

        return {
            ok: true,
            profile: sanitizeProfile(res.data.profile),
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
    }
};

async function loadProfile(): Promise<CacheProfile | null> {
    const userProfile: CacheProfile | null = getCachedProfile();
    if (userProfile && !isProfileExpired(userProfile.storedAt)) {
        return userProfile;
    }

    const res = await fromServer();

    if (!res.ok) {
        toast.error(res.error);
        return userProfile ?? null;
    }

    const fresh: CacheProfile = {
        storedAt: Date.now(),
        ...res.profile,
    };

    localStorage.setItem(storage_buckets.profile, JSON.stringify(fresh));
    return fresh;
}

export { loadProfile };
