'use client';
import RichTextInput from '../../common/RichTextInput';
import { cn } from '@/utils/cn';
import PlainTextInput from '../../common/PlainText';
import { useFormCreate } from '@/features/forms/providers/FormCreate';

interface MetaInputFeildsProps {
    sectionIdx: number;
}

function MetaInputFeilds({ sectionIdx }: MetaInputFeildsProps) {
    const { sections, handleSectionsChange } = useFormCreate();

    const meta = sections.get(sectionIdx);

    if (meta === undefined) return null;

    const patch = <K extends keyof typeof meta>(args: {
        key: K;
        value: (typeof meta)[K];
    }) => {
        handleSectionsChange(sectionIdx, args.key, args.value);
    };

    return (
        <div
            id={`section-${sectionIdx}`}
            className="floating-toolbar-selector w-full"
        >
            <div
                className={cn(
                    'bg-theme-form-container before:bg-theme-form-container-border/0 focus-within:before:bg-theme-form-container-border after:bg-theme-form-container-active relative h-full w-full overflow-hidden rounded-xl rounded-tl-none p-3 pt-3',
                    'before:absolute before:top-0 before:left-0 before:z-2 before:h-full before:w-2 before:rounded-l-xl before:transition-all before:duration-200 before:ease-in-out',
                    "after:absolute after:top-0 after:left-0 after:z-2 after:h-2 after:w-full after:rounded-t-xl after:transition-all after:duration-200 after:ease-in-out after:content-['']",
                    sections.size > 1 &&
                        'before:rounded-tl-none after:rounded-tl-none max-sm:rounded-t-none max-sm:after:rounded-t-none'
                )}
            >
                <div className="bg-theme-form-container group group-hover:before:bg-theme-form-container-border/40 focus-within:before:bg-theme-form-container-active flex w-full flex-col rounded-xl p-3 transition-all duration-200 ease-in-out">
                    <PlainTextInput
                        value={meta.title}
                        onChange={(value) =>
                            patch({
                                key: 'title',
                                value,
                            })
                        }
                        placeholder="Untitled Form"
                    />
                </div>
                <RichTextInput
                    placeholder="Form description"
                    textSize="normal"
                    allowLists={true}
                    value={meta.description}
                    onChange={(value) => patch({ key: 'description', value })}
                />
            </div>
        </div>
    );
}

export default MetaInputFeilds;
