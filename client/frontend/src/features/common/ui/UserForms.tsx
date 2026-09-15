'use client';

import FormsView from '../../user/components/client/FormsView';
import ViewFormsHeader from '../../user/components/client/FormsHeader';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import useGetAllForms from '@/features/forms/api/user/allForms';
import { toast } from 'sonner';
import { FormDB } from '@/lib/db';

type T = FormDB;

function UserForms() {
    const [viewAsRow, setViewAsRow] = useState(true);
    const { loading, handler } = useGetAllForms();
    const [data, setData] = useState<T[] | null>(null);

    const loadForms = useCallback(async () => {
        try {
            const res = (await handler()) as T[];
            console.log('Forms loaded:', res);
            setData(res);
        } catch (e) {
            if (e instanceof Error) {
                toast.info(e.message);
            }
            toast.error('Failed to load forms');
        }
    }, [handler]);

    useEffect(() => {
        function fetchData() {
            if (!loading && !data) {
                loadForms();
            }
        }

        fetchData();
    }, [data, loadForms, loading]);

    return (
        <>
            <ViewFormsHeader
                viewAsRow={viewAsRow}
                setViewAsRow={() => setViewAsRow(!viewAsRow)}
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
                    {data && data!.length > 0 
                        ? data.map((form, index) => (
                              <FormsView
                                  key={index}
                                  viewAsRow={viewAsRow}
                                  form={form}
                              />
                          ))
                        : 
                        <div className="flex h-full w-full flex-col items-center justify-center py-8 gap-2 flex-1 text-center text-theme-on-surface/80">
                            <h1 className="font-semibold">No forms yet</h1>
                            <p>Select a blank form or choose another template above to get started</p>
                        </div> 
                        }
                </div>
            </div>
        </>
    );
}

export default UserForms;
