'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import Link from 'next/link';
import { FormDB } from '@/types';
import { toISOString } from '@/features/forms/types/db.types';

interface MenuButtonProps {
    ref: React.RefObject<HTMLDivElement | null>;
    onClickEdit?: () => void;
    onClickDuplicate?: () => void;
    onClickDelete?: () => void;
    showMenu: boolean;
    setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

const MenuButton = ({
    ref,
    onClickEdit,
    onClickDuplicate,
    onClickDelete,
    showMenu,
    setShowMenu,
}: MenuButtonProps) => (
    <div className="relative" ref={ref}>
        <button
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu((prev) => !prev);
            }}
            className="hover:bg-brand-light/60 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 ease-in-out"
        >
            <span className="material-symbols-outlined">more_vert</span>
        </button>

        {showMenu && (
            <div className="absolute top-12 right-0 z-50 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg *:text-sm">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onClickEdit?.();
                        setShowMenu(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                >
                    Edit
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onClickDuplicate?.();
                        setShowMenu(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                >
                    Duplicate
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onClickDelete?.();
                        setShowMenu(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-left text-red-600 hover:bg-red-50"
                >
                    Delete
                </button>
            </div>
        )}
    </div>
);

const Icon = () => (
    <div className="bg-theme-form-container-active flex h-7 w-7 items-center justify-center rounded-md">
        <span className="material-symbols-outlined text-on-brand-depth">
            format_list_bulleted
        </span>
    </div>
);

export default function FormsView({
    viewAsRow,
    form,
}: Readonly<{ viewAsRow: boolean; form?: FormDB }>) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const title = form?.name || 'Untitled Form';
    const dateText = toISOString(form?.createdAt);
    const formUrl = `/forms/c/${form?.id}`;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setShowMenu(false);
            }
        }
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    if (!form) return null;
    if (viewAsRow) {
        return (
            <Link
                href={formUrl}
                className={cn(
                    'hover:bg-brand-light relative grid h-14 w-full cursor-pointer grid-cols-[1fr_auto] items-center rounded-md border border-transparent px-4 transition-all duration-150 ease-in-out *:text-sm md:grid-cols-[1fr_0.5fr]'
                )}
            >
                <div className="grid grid-cols-[36px_1fr] items-center gap-4">
                    <Icon />
                    <p className="font-medium">{title}</p>
                </div>
                <div className="grid items-center gap-4 min-[900px]:grid-cols-[1fr_36px] md:grid-cols-[1fr_36px] xl:grid-cols-[1fr_160px] xl:justify-end">
                    <p className="text-md max-[900px]:hidden">{dateText}</p>
                    <div className="flex items-center justify-end">
                        <MenuButton
                            ref={menuRef}
                            showMenu={showMenu}
                            setShowMenu={setShowMenu}
                        />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={formUrl}
            className="hover:bg-brand-light border-theme-skeletion-surface relative grid w-full cursor-pointer items-center gap-2 rounded-md border p-4 transition-all duration-150 ease-in-out *:text-sm"
        >
            <div className="flex flex-col gap-2">
                <div className="grid h-8 grid-cols-[36px_1fr_20px] items-center gap-1">
                    <Icon />
                    <p className="font-medium">{title}</p>
                    <MenuButton
                        ref={menuRef}
                        showMenu={showMenu}
                        setShowMenu={setShowMenu}
                    />
                </div>
            </div>
            <p className="my-2 text-sm">{dateText}</p>
        </Link>
    );
}
