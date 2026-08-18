'use client';

import FormsView from '../client/FormsView';
import ViewFormsHeader from '../client/FormsHeader';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import useGetAllForms from '@/features/forms/api/user/allForms';
import { toast } from 'sonner';
import { FormCore, Time } from '@/features/forms/types';

type T = FormCore & Time;
function UserForms() {
    const [viewAsRow, setViewAsRow] = useState(true);
    const { loading, handler } = useGetAllForms();
    const [data, setData] = useState<T[] | null>(null);

    const loadForms = useCallback(async () => {
        try {
            const res = (await handler()) as T[];
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
                    {data
                        ? data.map((form, index) => (
                              <FormsView
                                  key={index}
                                  viewAsRow={viewAsRow}
                                  form={form}
                              />
                          ))
                        : Array.from({ length: 10 }).map((_, index) => (
                              <FormsView
                                  key={index}
                                  viewAsRow={viewAsRow}
                                  form={undefined}
                              />
                          ))}
                </div>
            </div>
        </>
    );
}

export default UserForms;
