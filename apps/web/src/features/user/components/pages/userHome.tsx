'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserForms from '../../../common/ui/UserForms';
import UserFab from '../../../common/ui/userFab';
import UserHeader from '../ui/UserHeader';
import UserTemplateList from '../ui/UserTemplateList';
import { useAuth } from '@/providers';

const debounceFor = (term: string) => (term.length <= 3 ? 120 : 250);

function UserHome() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const router = useRouter();

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
            <div className="mt-2 mb-2 flex items-center justify-between px-1">
                <p className="text-theme-on-surface/60 text-xs font-medium tracking-wide uppercase">
                    Templates
                </p>
                <button
                    type="button"
                    onClick={() => router.push('/forms/templates')}
                    className="text-theme-on-surface/70 hover:text-theme-on-surface group flex items-center gap-1 text-sm font-medium transition-colors"
                >
                    More templates
                    <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">
                        arrow_forward
                    </span>
                </button>
            </div>
            <UserTemplateList />
            <UserForms query={debouncedQuery} />
            <UserFab />
        </main>
    );
}

export default UserHome;
