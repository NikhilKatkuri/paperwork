'use client';
import { useRef, useEffect } from 'react';

type TextSize = 'caption' | 'sm' | 'normal' | 'md' | 'heading' | 'display';

interface RichTextInputProps {
    textSize?: TextSize;
    placeholder?: string;
    value?: string;
    onChange?: (html: string) => void;
    allowLists?: boolean;
}

function RichTextInput({
    textSize = 'normal',
    placeholder,
    value,
    allowLists = false,
    onChange,
}: RichTextInputProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const textSizes: Record<TextSize, string> = {
        caption: 'text-xs',
        sm: 'text-sm',
        normal: 'text-base',
        md: 'text-lg',
        heading: 'text-lg md:text-xl',
        display: 'text-2xl md:text-3xl font-bold',
    };

    useEffect(() => {
        if (
            editorRef.current &&
            value !== undefined &&
            editorRef.current.innerHTML !== value
        ) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    // Formatter logic
    const formatText = (
        command: string,
        cmdValue: string | undefined = undefined
    ) => {
        document.execCommand(command, false, cmdValue);
        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleLink = () => {
        const url = prompt('Enter URL:');
        if (url) formatText('createLink', url);
    };

    const preventFocusLoss = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    return (
        <div className="bg-theme-form-container group group flex w-full flex-col rounded-xl p-3 transition-all duration-200 ease-in-out hover:before:bg-theme-form-container-border/40 focus-within:before:bg-theme-form-container-active">
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className={`${textSizes[textSize]} w-full font-medium outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`}
                data-placeholder={placeholder}
                onInput={() => onChange?.(editorRef.current?.innerHTML || '')}
            />

            <div className="bg-theme-form-container-border group-hover:bg-theme-form-container-active h-px w-full rounded-xl" />

            <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-in-out group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100 group-hover:grid-rows-[1fr] group-hover:opacity-100">
                <div className="overflow-hidden">
                    <div className="mt-2 flex items-center gap-2">
                        <button
                            type="button"
                            onMouseDown={preventFocusLoss}
                            onClick={() => formatText('bold')}
                            className="hover:bg-theme-form-container-border/40 text-theme-form-on-surface/70 flex h-9 w-9 items-center justify-center rounded-full p-1 transition-colors"
                        >
                            <span className="material-icons-extended scale-90">
                                format_bold
                            </span>
                        </button>

                        <button
                            type="button"
                            onMouseDown={preventFocusLoss}
                            onClick={() => formatText('italic')}
                            className="hover:bg-theme-form-container-border/40 text-theme-form-on-surface/70 flex h-9 w-9 items-center justify-center rounded-full p-1 transition-colors"
                        >
                            <span className="material-icons-extended scale-90">
                                format_italic
                            </span>
                        </button>

                        <button
                            type="button"
                            onMouseDown={preventFocusLoss}
                            onClick={() => formatText('underline')}
                            className="hover:bg-theme-form-container-border/40 text-theme-form-on-surface/70 flex h-9 w-9 items-center justify-center rounded-full p-1 transition-colors"
                        >
                            <span className="material-icons-extended scale-90">
                                format_underlined
                            </span>
                        </button>

                        <button
                            type="button"
                            onMouseDown={preventFocusLoss}
                            onClick={handleLink}
                            className="hover:bg-theme-form-container-border/40 text-theme-form-on-surface/70 flex h-9 w-9 items-center justify-center rounded-full p-1 transition-colors"
                        >
                            <span className="material-icons-extended scale-90">
                                link
                            </span>
                        </button>
                        {allowLists && (
                            <>
                                <button
                                    type="button"
                                    onMouseDown={preventFocusLoss}
                                    onClick={() =>
                                        formatText('insertUnorderedList')
                                    }
                                    className="hover:bg-theme-form-container-border/40 text-theme-form-on-surface/70 flex h-9 w-9 items-center justify-center rounded-full p-1 transition-colors"
                                >
                                    <span className="material-icons-extended scale-90">
                                        format_list_bulleted
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={preventFocusLoss}
                                    onClick={() =>
                                        formatText('insertOrderedList')
                                    }
                                    className="hover:bg-theme-form-container-border/40 text-theme-form-on-surface/70 flex h-9 w-9 items-center justify-center rounded-full p-1 transition-colors"
                                >
                                    <span className="material-icons-extended scale-90">
                                        format_list_numbered
                                    </span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RichTextInput;
