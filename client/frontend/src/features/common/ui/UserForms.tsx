'use client';

import FormsView from '../../user/components/client/FormsView';
import ViewFormsHeader from '../../user/components/client/FormsHeader';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import useGetAllForms from '@/features/forms/api/user/allForms';
import { toast } from 'sonner';
import { FormDB } from '@/lib/db';

function UserForms() {
    const [viewAsRow, setViewAsRow] = useState(true);
    const { handler } = useGetAllForms();
    const [data, setData] = useState<FormDB[] | null>(null);

    /**
     * StrictMode mounts, unmounts, then remounts this effect in dev. The first
     * request is aborted rather than merely ignored, so its result can never be
     * discarded after the remount - and no `loaded` ref is needed to suppress
     * the second call, which is what would otherwise strand `data` at null.
     */
    useEffect(() => {
        const controller = new AbortController();

        handler(controller.signal)
            .then((forms) => setData(forms))
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;
                toast.error(
                    e instanceof Error ? e.message : 'Failed to load forms'
                );
            });

        return () => controller.abort();
    }, [handler]);

    return (
        <>
            <ViewFormsHeader
                viewAsRow={viewAsRow}
                setViewAsRow={() => setViewAsRow((prev) => !prev)}
            />
            <div className="mt-5 h-auto flex-1">
                <div
                    className={cn(
                        'grid',
                        viewAsRow
                            ? ''
                            : 'grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
                    )}
                >
                    {data && data.length > 0 ? (
                        data.map((form) => (
                            <FormsView
                                key={form._id}
                                viewAsRow={viewAsRow}
                                form={form}
                            />
                        ))
                    ) : (
                        <div className="text-theme-on-surface/80 flex h-full w-full flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                            <h1 className="font-semibold">No forms yet</h1>
                            <p>
                                Select a blank form or choose another template
                                above to get started
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default UserForms;
