'use client';

import { useAuth } from '@/providers';
import React, { useEffect, useState } from 'react';
import { COUNTRIES, GENDERS, LANGUAGES } from '../../constants/enums';
import { sensitiveData } from '@/types';
import useUserPersonalInfo, {
    useRetrievePersonalInfo,
} from '../../api/personalInfo';
import { toast } from 'sonner';

export default function PersonalInfoComponent() {
    const { decodedToken } = useAuth();

    const [gender, setGender] = useState<sensitiveData['gender']>('non-binary');
    const [dob, setDob] = useState<string>('');

    const { saving, update } = useUserPersonalInfo();

    const { loading, personalInfo, retrieve } = useRetrievePersonalInfo();

    useEffect(() => {
        retrieve();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        function setInitialValues() {
            if (personalInfo?.gender) {
                setGender(personalInfo.gender);
            }

            if (personalInfo?.dob) {
                setDob(new Date(personalInfo.dob).toISOString().split('T')[0]);
            } else {
                setDob('');
            }
        }
        setInitialValues();
    }, [personalInfo]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const formData = new FormData(e.currentTarget);

            const rawDob = formData.get('dateOfBirth') as string;

            const country = formData.get('country') as sensitiveData['country'];

            const language = formData.get(
                'language'
            ) as sensitiveData['language'];

            const updatedData: Partial<sensitiveData> = {
                dob: rawDob ? new Date(rawDob) : undefined,
                gender,
                country: country || undefined,
                language: language || undefined,
            };

            const filteredData = Object.fromEntries(
                Object.entries(updatedData).filter(
                    ([, value]) => value !== undefined && value !== null
                )
            ) as Partial<sensitiveData>;

            const res = await update(filteredData);

            if (res.success) {
                toast.success('Personal information updated successfully');
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error('Error saving personal information:', error);

            toast.error('Failed to update personal information');
        }
    };

    const handleReset = () => {
        setGender(personalInfo?.gender ?? 'non-binary');
        setDob(
            personalInfo?.dob
                ? new Date(personalInfo.dob).toISOString().split('T')[0]
                : ''
        );
    };

    if (loading) {
        return (
            <div
                role="status"
                aria-live="polite"
                className="flex max-w-xl flex-col gap-6"
            >
                <span className="sr-only">Loading personal information…</span>

                <div className="mt-4 grid grid-cols-1 gap-6">
                    <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-10 w-1/2 animate-pulse rounded-lg bg-gray-100" />
                    <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
                <div className="mt-4 grid max-w-xl grid-cols-1 gap-6">
                    <section aria-label="Email Information">
                        <div className="grid w-full grid-cols-1 gap-3">
                            <h2 className="text-md font-semibold md:text-lg">
                                Your account
                            </h2>

                            <label
                                htmlFor="email"
                                className="rounded-xl border border-gray-300 p-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500"
                            >
                                <span className="block text-xs text-gray-500">
                                    Email
                                </span>

                                <input
                                    type="email"
                                    id="email"
                                    value={decodedToken?.email ?? ''}
                                    disabled
                                    className="w-full border-none bg-transparent py-1 text-base font-medium outline-none disabled:opacity-60"
                                />
                            </label>
                        </div>
                    </section>

                    <section aria-label="Personal Information">
                        <form onSubmit={handleSubmit} onReset={handleReset}>
                            <div className="grid w-full grid-cols-1 gap-4">
                                <div>
                                    <h2 className="text-md font-semibold md:text-lg">
                                        Personal information
                                    </h2>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Completely optional fields
                                    </p>
                                </div>

                                <label
                                    htmlFor="dateOfBirth"
                                    className="rounded-xl border border-gray-300 p-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500"
                                >
                                    <span className="block text-xs text-gray-500">
                                        Date of Birth
                                    </span>

                                    <input
                                        type="date"
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        value={dob}
                                        className="w-full border-none bg-transparent py-1 text-base font-medium outline-none"
                                        onChange={(e) => setDob(e.target.value)}
                                    />
                                </label>

                                <fieldset className="grid gap-2">
                                    <legend className="text-xs text-gray-500">
                                        Gender
                                    </legend>

                                    <div className="flex flex-wrap items-center gap-4 pt-1">
                                        {Object.values(GENDERS).map((value) => (
                                            <label
                                                key={value}
                                                className="flex cursor-pointer items-center gap-2 text-sm capitalize"
                                            >
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value={value}
                                                    checked={gender === value}
                                                    onChange={() =>
                                                        setGender(value)
                                                    }
                                                    className="h-4 w-4 accent-blue-600"
                                                />

                                                {value}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>

                                <label
                                    htmlFor="country"
                                    className="rounded-xl border border-gray-300 p-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500"
                                >
                                    <span className="block text-xs text-gray-500">
                                        Country/Region
                                    </span>

                                    <select
                                        id="country"
                                        name="country"
                                        defaultValue={
                                            personalInfo?.country ?? ''
                                        }
                                        className="w-full border-none bg-transparent py-1 text-base font-medium outline-none"
                                    >
                                        <option value="">Select Country</option>

                                        {Object.keys(COUNTRIES).map(
                                            (countryKey) => (
                                                <option
                                                    key={countryKey}
                                                    value={countryKey}
                                                >
                                                    {countryKey}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label
                                    htmlFor="language"
                                    className="rounded-xl border border-gray-300 p-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500"
                                >
                                    <span className="block text-xs text-gray-500">
                                        Language
                                    </span>

                                    <select
                                        id="language"
                                        name="language"
                                        defaultValue={
                                            personalInfo?.language ?? ''
                                        }
                                        className="w-full border-none bg-transparent py-1 text-base font-medium outline-none"
                                    >
                                        <option value="">
                                            Select Language
                                        </option>

                                        {LANGUAGES.map((lang) => (
                                            <option key={lang} value={lang}>
                                                {lang}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="flex w-full items-center justify-end gap-4 py-4 md:pt-6">
                                <button
                                    type="reset"
                                    disabled={saving}
                                    className="cursor-pointer rounded-full bg-gray-100 px-7 py-4 text-sm font-semibold transition-all duration-200 hover:bg-gray-900 hover:text-white disabled:opacity-50 sm:px-8"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="cursor-pointer rounded-full bg-blue-600 px-7 py-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 sm:px-8"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}