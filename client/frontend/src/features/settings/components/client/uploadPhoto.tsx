'use client';

import { cn } from '@/utils/cn';
import normalizeUrl from '@/utils/profile';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function UploadPhoto({
    url,
    setRawFile,
}: {
    url: string;
    setRawFile: (file: File) => void;
}) {
    const normalizedUrl = useMemo(() => normalizeUrl(url), [url]);
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        return () => {
            if (preview?.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const openFilePicker = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Revoke the older local blob before creating a new one
        if (preview?.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Pass the actual File binary object to parent component for eventual upload
        setRawFile(file);

        // DO NOT call changeUrl(objectUrl) here!
        // Keep the main backend state clean until Cloudinary completes the upload.

        event.target.value = '';
    };

    // Priority: Local file preview > Persistent normalized URL
    const imageSrc =
        preview || (normalizedUrl.type === 'custom' ? normalizedUrl.url : null);

    return (
        <div>
            <h1 className="text-theme-on-surface/60 text-sm">Photo</h1>

            <div className="mt-5 flex items-center gap-6">
                <div className="border-theme-on-surface/30 bg-theme-surface h-18 w-18 overflow-hidden rounded-full border">
                    {imageSrc ? (
                        <Image
                            src={imageSrc}
                            alt="Profile photo"
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                            unoptimized={imageSrc.startsWith('blob:')}
                        />
                    ) : normalizedUrl.type === 'random' ? (
                        <div
                            className={cn(
                                'flex h-full w-full items-center justify-center'
                            )}
                            style={{ backgroundColor: normalizedUrl.color }}
                        >
                            <span className="text-md text-center font-medium text-white">
                                {normalizedUrl.name
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((n) => n.charAt(0).toUpperCase())
                                    .join('')}
                            </span>
                        </div>
                    ) : null}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <button
                    type="button"
                    onClick={openFilePicker}
                    className="bg-theme-grey-lg text-surface hover:bg-brand-depth hover:text-on-brand-depth cursor-pointer rounded-xl p-2.5 px-4 text-sm font-semibold transition-all duration-200 ease-in-out"
                >
                    Change
                </button>
            </div>
        </div>
    );
}
