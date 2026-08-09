import Profile from '@/types';

export type PublicProfile = Pick<
    Profile,
    'avatarUrl' | 'bio' | 'fullName' | 'userId'
>;

export function sanitizeProfile(profile: Profile): PublicProfile {
    return {
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        fullName: profile.fullName,
        userId: profile.userId,
    };
}
export type ProfileResult =
    { ok: true; profile: Profile } | { ok: false; error: string };
