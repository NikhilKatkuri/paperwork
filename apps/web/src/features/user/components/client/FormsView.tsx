'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/cn';
import { FormDB } from '@/types';
import { toDate } from '@/features/forms/types/db.types';

const LONG_PRESS_MS = 500;

interface MenuButtonProps {
    ref: React.RefObject<HTMLDivElement | null>;
    onClickDuplicate?: () => void;
    onClickDelete?: () => void;
    onClickUnpublish?: () => void;
    published?: boolean;
    busy?: boolean;
    showMenu: boolean;
    setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

const MenuButton = ({
    ref,
    onClickDuplicate,
    onClickDelete,
    onClickUnpublish,
    published,
    busy,
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
            aria-label="Form actions"
            aria-expanded={showMenu}
            aria-haspopup="menu"
            className="hover:bg-brand-light/60 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 ease-in-out"
        >
            <span className="material-symbols-outlined">more_vert</span>
        </button>

        {showMenu && (
            <div
                role="menu"
                className="absolute top-12 right-0 z-50 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg *:text-sm"
            >
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onClickDuplicate?.();
                        setShowMenu(false);
                    }}
                    disabled={busy}
                    className="flex w-full items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                    {busy ? 'Working…' : 'Duplicate'}
                </button>
                {published ? (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onClickUnpublish?.();
                            setShowMenu(false);
                        }}
                        disabled={busy}
                        className="flex w-full items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Unpublish
                    </button>
                ) : null}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onClickDelete?.();
                        setShowMenu(false);
                    }}
                    disabled={busy}
                    className="flex w-full items-center px-4 py-2 text-left text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                    Move to bin
                </button>
            </div>
        )}
    </div>
);

const SelectBox = ({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
}) => (
    <input
        type="checkbox"
        checked={checked}
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
        onChange={onChange}
        className="h-4 w-4 cursor-pointer accent-[var(--brand-depth)]"
    />
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
    busy,
    selected,
    selectionMode,
    onLongPress,
    onSelect,
    onDelete,
    onDuplicate,
    onUnpublish,
}: Readonly<{
    viewAsRow: boolean;
    form?: FormDB;
    busy?: boolean;
    selected?: boolean;
    selectionMode?: boolean;
    onLongPress?: (formId: string) => void;
    onSelect?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onUnpublish?: () => void;
}>) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressFired = useRef(false);

    const title = form?.name || 'Untitled Form';
    const dateText = toDate(form?.createdAt);
    const formUrl = `/forms/c/${form?.id}`;
    const published = Boolean(form?.isPublished);
    const selecting = Boolean(selectionMode);

    const cancelPress = useCallback(() => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = null;
    }, []);

    useEffect(() => cancelPress, [cancelPress]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setShowMenu(false);
            }
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') setShowMenu(false);
        }
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showMenu]);

    const startPress = () => {
        if (selecting || !form) return;
        longPressFired.current = false;
        cancelPress();
        pressTimer.current = setTimeout(() => {
            longPressFired.current = true;
            onLongPress?.(form.id);
        }, LONG_PRESS_MS);
    };

    const handleClick = () => {
        if (longPressFired.current) {
            longPressFired.current = false;
            return;
        }
        if (!selecting && form) router.push(formUrl);
    };

    const pressHandlers = selecting
        ? {}
        : {
              onPointerDown: startPress,
              onPointerUp: cancelPress,
              onPointerLeave: cancelPress,
              onPointerCancel: cancelPress,
          };

    if (!form) return null;
    if (viewAsRow) {
        return (
            <div
                role="link"
                tabIndex={selecting ? -1 : 0}
                onClick={handleClick}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') handleClick();
                }}
                {...pressHandlers}
                className={cn(
                    'hover:bg-brand-light relative grid h-14 w-full cursor-pointer items-center gap-3 rounded-md border border-transparent px-4 transition-all duration-150 ease-in-out *:text-sm',
                    selecting
                        ? 'grid-cols-[20px_1fr_auto] md:grid-cols-[20px_1fr_0.5fr]'
                        : 'grid-cols-[1fr_auto] md:grid-cols-[1fr_0.5fr]'
                )}
            >
                {selecting && (
                    <SelectBox
                        checked={Boolean(selected)}
                        onChange={() => onSelect?.()}
                        label={`Select ${title}`}
                    />
                )}
                <div className="grid min-w-0 grid-cols-[36px_1fr] items-center gap-4">
                    <Icon />
                    <p className="truncate font-medium">{title}</p>
                </div>
                <div className="grid items-center gap-4 min-[900px]:grid-cols-[1fr_36px] md:grid-cols-[1fr_36px] xl:grid-cols-[1fr_160px] xl:justify-end">
                    <p className="text-md max-[900px]:hidden">{dateText}</p>
                    <div className="flex items-center justify-end">
                        {selecting ? (
                            <span
                                className={cn(
                                    'material-symbols-outlined text-xl',
                                    selected
                                        ? 'text-brand-depth'
                                        : 'text-theme-on-surface/30'
                                )}
                            >
                                {selected ? 'check_circle' : 'circle'}
                            </span>
                        ) : (
                            <MenuButton
                                ref={menuRef}
                                showMenu={showMenu}
                                setShowMenu={setShowMenu}
                                busy={busy}
                                published={published}
                                onClickDelete={onDelete}
                                onClickDuplicate={onDuplicate}
                                onClickUnpublish={onUnpublish}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            role="link"
            tabIndex={selecting ? -1 : 0}
            onClick={handleClick}
            onKeyDown={(event) => {
                if (event.key === 'Enter') handleClick();
            }}
            {...pressHandlers}
            className="hover:bg-brand-light border-theme-skeletion-surface relative grid w-full cursor-pointer items-center gap-2 rounded-md border p-4 transition-all duration-150 ease-in-out *:text-sm"
        >
            <div className="flex flex-col gap-2">
                <div
                    className={cn(
                        'grid h-8 items-center gap-1',
                        selecting
                            ? 'grid-cols-[20px_36px_1fr_20px]'
                            : 'grid-cols-[36px_1fr_20px]'
                    )}
                >
                    {selecting && (
                        <SelectBox
                            checked={Boolean(selected)}
                            onChange={() => onSelect?.()}
                            label={`Select ${title}`}
                        />
                    )}
                    <Icon />
                    <p className="truncate font-medium">{title}</p>
                    {selecting ? (
                        <span
                            className={cn(
                                'material-symbols-outlined text-xl',
                                selected
                                    ? 'text-brand-depth'
                                    : 'text-theme-on-surface/30'
                            )}
                        >
                            {selected ? 'check_circle' : 'circle'}
                        </span>
                    ) : (
                        <MenuButton
                            ref={menuRef}
                            showMenu={showMenu}
                            setShowMenu={setShowMenu}
                            busy={busy}
                            published={published}
                            onClickDelete={onDelete}
                            onClickDuplicate={onDuplicate}
                            onClickUnpublish={onUnpublish}
                        />
                    )}
                </div>
            </div>
            <p className="my-2 text-sm">{dateText}</p>
        </div>
    );
}
