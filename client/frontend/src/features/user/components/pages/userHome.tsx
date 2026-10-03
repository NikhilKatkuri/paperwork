'use client';

import { useCallback, useEffect, useState } from 'react';
import UserForms from '../../../common/ui/UserForms';
import UserFab from '../../../common/ui/userFab';
import UserHeader from '../ui/UserHeader';
import UserTemplateList from '../ui/UserTemplateList';

/**
 * Short terms settle fast so the box feels instant; longer ones wait, because
 * they are far more likely to be extended.
 */
const debounceFor = (term: string) => (term.length <= 3 ? 120 : 250);

function UserHome() {
    // `query` is what the box shows, `debouncedQuery` is what the list filters
    // on - filtering per keystroke re-renders every card for no benefit.
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(
            () => setDebouncedQuery(query.trim()),
            debounceFor(query.trim())
        );

        return () => clearTimeout(timer);
    }, [query]);

    const onQueryChange = useCallback((value: string) => {
        setQuery(value);
    }, []);

    return (
        <main className="relative mx-auto h-full w-full max-w-7xl scrollbar-none overflow-y-auto px-2 min-[44rem]:px-5">
            <UserHeader query={query} onQueryChange={onQueryChange} />
            <UserTemplateList />
            <UserForms query={debouncedQuery} />
            <UserFab />
        </main>
    );
}

export default UserHome;
