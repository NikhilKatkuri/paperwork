'use client';

import { useCallback, useRef } from 'react';

export default function useSafeAction<TArgs extends unknown[]>(
    action: (...args: TArgs) => Promise<void> | void
) {
    const isRunningRef = useRef(false);

    const safeAction = useCallback(
        async (...args: TArgs): Promise<void> => {
            if (isRunningRef.current) return;

            isRunningRef.current = true;

            try {
                await action(...args);
            } finally {
                isRunningRef.current = false;
            }
        },
        [action]
    );

    return safeAction;
}
