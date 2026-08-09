'use client';

import FormsView from '../client/FormsView';
import ViewFormsHeader from '../client/FormsHeader';
import { useState } from 'react';
import { cn } from '@/utils/cn';

function UserForms() {
    const [viewAsRow, setViewAsRow] = useState(true);

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
                    {Array.from({ length: 100 }).map((_, index) => (
                        <FormsView key={index} viewAsRow={viewAsRow} />
                    ))}
                </div>
            </div>
        </>
    );
}

export default UserForms;
