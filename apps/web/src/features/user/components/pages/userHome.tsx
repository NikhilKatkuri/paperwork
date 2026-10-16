'use client';

import { useCallback, useEffect, useState } from 'react';
import UserForms from '../../../common/ui/UserForms';
import UserFab from '../../../common/ui/userFab';
import UserHeader from '../ui/UserHeader';
import UserTemplateList from '../ui/UserTemplateList';
import { useAuth } from '@/providers';

const debounceFor = (term: string) => (term.length <= 3 ? 120 : 250);

function UserHome() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const { publicProfile } = useAuth();

    useEffect(() => {
        document.title = `Paperwork ${publicProfile ? '| ' + publicProfile.fullName : ''}`;
    }, [publicProfile]);

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
