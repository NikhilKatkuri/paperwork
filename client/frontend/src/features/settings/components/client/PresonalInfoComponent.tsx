'use client';
import { useAuth } from '@/providers';
import React, { useState } from 'react';
import { COUNTRIES, LANGUAGES } from '../../constants/enums';

export default function PresonalInfoComponent() {
    const { decodedToken } = useAuth();
    const [formData, setFormData] = useState({
        dateOfBirth: '',
        gender: '',
        country: '',
        language: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
    };

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
                                className="border-theme-on-surface/40 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 focus-within:ring-2"
                            >
                                <span className="text-theme-on-surface/60 block text-xs">
                                    Email
                                </span>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={decodedToken?.email ?? ''}
                                    disabled
                                    className="text-theme-on-surface w-full border-none bg-transparent py-1 text-base font-medium focus:outline-none disabled:opacity-60"
                                />
                            </label>
                        </div>
                    </section>
                    <section aria-label="Personal Information">
                        <form onSubmit={handleSubmit}>
                            <div className="grid w-full grid-cols-1 gap-4">
                                <div>
                                    <h2 className="text-md font-semibold md:text-lg">
                                        Personal information
                                    </h2>
                                    <p className="text-theme-on-surface/60 mt-0.5 text-xs">
                                        Completely optional fields
                                    </p>
                                </div>
        
                                <label
                                    htmlFor="dateOfBirth"
                                    className="border-theme-on-surface/40 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 focus-within:ring-2"
                                >
                                    <span className="text-theme-on-surface/60 block text-xs">
                                        Date of Birth
                                    </span>
                                    <input
                                        type="date"
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className="text-theme-on-surface w-full border-none bg-transparent py-1 text-base font-medium focus:outline-none"
                                    />
                                </label>

                                {/* Gender Selection */}
                                <fieldset className="grid gap-2">
                                    <legend className="text-theme-on-surface/60 text-xs">
                                        Gender
                                    </legend>
                                    <div className="flex items-center gap-4 pt-1">
                                        {['male', 'female', 'other'].map(
                                            (option) => (
                                                <label
                                                    key={option}
                                                    className="flex cursor-pointer items-center gap-2 text-sm capitalize"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="gender"
                                                        value={option}
                                                        checked={
                                                            formData.gender ===
                                                            option
                                                        }
                                                        onChange={handleChange}
                                                        className="accent-brand-depth h-4 w-4"
                                                    />
                                                    {option}
                                                </label>
                                            )
                                        )}
                                    </div>
                                </fieldset>

                                {/* Country Select */}
                                <label
                                    htmlFor="country"
                                    className="border-theme-on-surface/40 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 focus-within:ring-2"
                                >
                                    <span className="text-theme-on-surface/60 block text-xs">
                                        Country/Region
                                    </span>
                                    <select
                                        id="country"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="text-theme-on-surface w-full border-none bg-transparent py-1 text-base font-medium focus:outline-none"
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

                                {/* Language Select */}
                                <label
                                    htmlFor="language"
                                    className="border-theme-on-surface/40 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 focus-within:ring-2"
                                >
                                    <span className="text-theme-on-surface/60 block text-xs">
                                        Language
                                    </span>
                                    <select
                                        id="language"
                                        name="language"
                                        value={formData.language}
                                        onChange={handleChange}
                                        className="text-theme-on-surface w-full border-none bg-transparent py-1 text-base font-medium focus:outline-none"
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
                                    type="button"
                                    className="bg-theme-form-on-surface/10 hover:bg-theme-form-on-surface/90 text-theme-on-surface cursor-pointer rounded-full p-4 px-7 text-sm font-semibold transition-all duration-200 ease-in-out hover:text-white sm:px-8"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-brand-depth text-on-brand-depth hover:bg-brand-depth/90 cursor-pointer rounded-full p-4 px-7 text-sm font-semibold transition-all duration-200 disabled:opacity-50 sm:px-8"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
