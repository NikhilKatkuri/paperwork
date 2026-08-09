'use client';

import { memo, useEffect, useState } from 'react';
import UploadPhoto from '../components/client/uploadPhoto';
import { PublicProfile } from '@/types';
import { useAuth } from '@/providers';
import useProfileUpdate from '../functions/updateprofile';

const EditProfilePage = memo(() => {
    const { publicProfile, setPublicProfile } = useAuth();
    const { loading, updateProfile } = useProfileUpdate();

    const [profile, setProfile] = useState<PublicProfile>({
        userId: '',
        fullName: '',
        avatarUrl: '',
        bio: '',
    });

    const [hydrated, setHydrated] = useState(false);
    const [rawFile, setRawFile] = useState<File | null>(null);

    useEffect(() => {
        if (!hydrated && publicProfile) {
            setProfile({
                userId: publicProfile.userId || '',
                fullName: publicProfile.fullName || '',
                avatarUrl: publicProfile.avatarUrl || '',
                bio: publicProfile.bio || '',
            });
            setHydrated(true);
        }
    }, [publicProfile, hydrated]);

    return (
        <div className="flex h-auto flex-col gap-6 md:h-full">
            <div className="text-theme-on-surface h-full w-full flex-1 flex-col gap-6">
                <h1 className="my-2 text-lg font-bold md:text-xl">
                    Edit Profile
                </h1>
                <p className="md:text-md text-sm">
                    Keep your personal details private.
                    <br /> Information you add here is visible to anyone who can
                    view your profile.
                </p>

                <div className="mt-10 grid max-w-xl grid-cols-1 space-y-4">
                    <UploadPhoto
                        url={profile.avatarUrl}
                        setRawFile={(file) => setRawFile(file)}
                    />

                    <label
                        htmlFor="fullName"
                        className="border-theme-on-surface/40 active:border-brand-depth/90 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 ease-in-out focus-within:ring-2"
                    >
                        <h1 className="text-theme-on-surface/60 text-xs">
                            Full Name
                        </h1>
                        <input
                            type="text"
                            id="fullName"
                            className="text-theme-on-surface w-full border-none bg-transparent py-1.5 text-base font-medium focus:outline-none"
                            value={profile.fullName}
                            onChange={(e) =>
                                setProfile({
                                    ...profile,
                                    fullName: e.target.value,
                                })
                            }
                        />
                    </label>

                    <label
                        htmlFor="Bio"
                        className="border-theme-on-surface/40 active:border-brand-depth/90 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 ease-in-out focus-within:ring-2"
                    >
                        <h1 className="text-theme-on-surface/60 text-xs">
                            Bio
                        </h1>
                        <textarea
                            id="Bio"
                            value={profile.bio}
                            onChange={(e) =>
                                setProfile({ ...profile, bio: e.target.value })
                            }
                            placeholder="Write something about yourself..."
                            className="text-theme-on-surface min-h-8 w-full resize-none border-none bg-transparent py-1.5 text-base font-medium focus:outline-none"
                        />
                    </label>
                </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-6">
                <button
                    type="button"
                    className="bg-theme-grey-lg hover:bg-brand-depth hover:text-on-brand-depth text-surface cursor-pointer rounded-xl p-2.5 px-4 text-sm font-semibold transition-all duration-200 ease-in-out"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => {
                        updateProfile(
                            profile,
                            (data) => setPublicProfile(data),
                            rawFile,
                            publicProfile
                        );
                    }}
                    disabled={loading}
                    className="bg-brand-depth hover:bg-brand-depth/90 text-on-brand-depth cursor-pointer rounded-xl p-2.5 px-4 text-sm font-semibold transition-all duration-200 ease-in-out disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
});

EditProfilePage.displayName = 'EditProfilePage';
export default EditProfilePage;
