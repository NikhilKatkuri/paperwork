'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Toggle from '../common/Toggle';
import { useFormCreate } from '../../providers/FormCreate';

export interface FormSettingsData {
    maxResponses?: number;
    maxResponsesPerUser?: number;
    closeDate?: string;
    startDate?: string;
    timeLimitPerResponse?: number;
    collectEmail: boolean;
    shuffleQuestions: boolean;
    allowEditResponse: boolean;
    saveAndContinueLater: boolean;
    progressBar: boolean;
    customConfirmationMessage?: string;
    redirectUrl?: string;
}

const DEFAULT_SETTINGS: FormSettingsData = {
    maxResponses: undefined,
    maxResponsesPerUser: undefined,
    closeDate: undefined,
    startDate: undefined,
    timeLimitPerResponse: undefined,
    collectEmail: false,
    shuffleQuestions: false,
    allowEditResponse: false,
    saveAndContinueLater: false,
    progressBar: false,
    customConfirmationMessage: '',
    redirectUrl: '',
};

interface IconProps {
    name: string;
    className?: string;
}

function Icon({ name, className = '' }: Readonly<IconProps>) {
    return (
        <span
            className={`material-symbols-outlined leading-none ${className}`}
            style={{ fontSize: '18px' }}
        >
            {name}
        </span>
    );
}

interface RowProps {
    icon: string;
    title: string;
    hint?: string;
    children: ReactNode;
}

function Row({ icon, title, hint, children }: Readonly<RowProps>) {
    return (
        <div className="flex items-start justify-between gap-6 py-4">
            <div className="flex min-w-0 gap-3">
                <Icon name={icon} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                    <p className="text-[14px] leading-5">{title}</p>
                    {hint && (
                        <p className="mt-0.5 text-[12.5px] leading-4">{hint}</p>
                    )}
                </div>
            </div>
            <div className="shrink-0 pt-0.5">{children}</div>
        </div>
    );
}

interface NumberFieldProps {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    placeholder?: string;
    suffix?: string;
}

function NumberField({
    value,
    onChange,
    placeholder,
    suffix,
}: Readonly<NumberFieldProps>) {
    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                min={0}
                value={value ?? ''}
                onChange={(e) =>
                    onChange(
                        e.target.value === ''
                            ? undefined
                            : Number(e.target.value)
                    )
                }
                placeholder={placeholder}
                className="border-theme-form-container-border bg-theme-surface w-24 rounded-md border px-2.5 py-1.5 text-right text-[13.5px] focus:outline-none"
            />
            {suffix && <span className="text-[12.5px]">{suffix}</span>}
        </div>
    );
}

interface DateFieldProps {
    value: string | undefined;
    onChange: (value: string | undefined) => void;
}

function DateField({ value, onChange }: Readonly<DateFieldProps>) {
    const formattedValue = value ? value.slice(0, 16) : '';

    return (
        <input
            type="datetime-local"
            value={formattedValue}
            onChange={(e) =>
                onChange(e.target.value === '' ? undefined : e.target.value)
            }
            className="border-theme-form-container-border bg-theme-surface rounded-md border px-2.5 py-1.5 text-[13px] focus:outline-none"
        />
    );
}

interface SectionTitleProps {
    index: string;
    children: ReactNode;
}

function SectionTitle({ children, index }: Readonly<SectionTitleProps>) {
    return (
        <div className="flex items-baseline gap-3">
            <span className="text-[12.5px] italic">{index}</span>
            <h2 className="text-[17px]">{children}</h2>
        </div>
    );
}

export interface FormSettingsProps {
    onSave?: (settings: FormSettingsData) => void;
}

/** Helper to transform ISO strings to Date objects for the provider */
function toProviderPayload(settings: FormSettingsData) {
    return {
        ...settings,
        startDate: settings.startDate
            ? new Date(settings.startDate)
            : undefined,
        closeDate: settings.closeDate
            ? new Date(settings.closeDate)
            : undefined,
    };
}

export default function FormSettings({ onSave }: Readonly<FormSettingsProps>) {
    const { form, handleFormChange } = useFormCreate();

    const [settings, setSettings] = useState<FormSettingsData>(() => {
        return {
            ...DEFAULT_SETTINGS,
        };
    });

    // Sync when initial hydration occurs
    useEffect(() => {
        function sync() {
            if (form?.settings) {
                const formSettings = form.settings as Record<string, unknown>;

                const parseDate = (val: unknown): string | undefined => {
                    if (!val) return undefined;
                    if (val instanceof Date) return val.toISOString();
                    if (typeof val === 'string') return val;
                    return undefined;
                };

                const safeSettings = Object.keys(DEFAULT_SETTINGS).reduce(
                    (acc, key) => {
                        const typedKey = key as keyof FormSettingsData;
                        const val = formSettings[typedKey];

                        if (
                            typedKey === 'startDate' ||
                            typedKey === 'closeDate'
                        ) {
                            acc[typedKey] = parseDate(val) as never;
                        } else {
                            acc[typedKey] = (val ??
                                DEFAULT_SETTINGS[typedKey]) as never;
                        }

                        return acc;
                    },
                    {} as FormSettingsData
                );

                setSettings((prev) => ({
                    ...prev,
                    ...safeSettings,
                }));
            }
        }
        sync();
    }, [form?.settings]);

    function set<K extends keyof FormSettingsData>(key: K) {
        return (value: FormSettingsData[K]) => {
            setSettings((prev) => ({
                ...prev,
                [key]: value,
            }));
        };
    }

    const handleSave = () => {
        handleFormChange('settings', toProviderPayload(settings));
        onSave?.(settings);
    };

    return (
        <div className="mx-auto flex h-full w-full scrollbar-none flex-col items-center gap-4 overflow-y-scroll py-3 max-md:px-3 lg:max-w-3xl">
            <div className="bg-theme-form-container mx-auto w-full max-w-3xl px-6 py-14">
                <header className="border-theme-form-container-border mb-10 border-b pb-6">
                    <p className="text-theme-form-on-surface text-[22px]">
                        Form settings
                    </p>
                    <p className="mt-1.5 text-[13.5px] leading-5">
                        Control who can respond, when the form is open, and what
                        happens after someone submits it.
                    </p>
                </header>

                <div className="space-y-10">
                    <section>
                        <SectionTitle index="01">Responses</SectionTitle>
                        <div className="divide-theme-form-container-border mt-1 divide-y">
                            <Row
                                icon="group"
                                title="Total response limit"
                                hint="Close the form automatically after this many submissions"
                            >
                                <NumberField
                                    value={settings.maxResponses}
                                    onChange={set('maxResponses')}
                                    placeholder="No limit"
                                />
                            </Row>
                            <Row
                                icon="how_to_reg"
                                title="Responses per person"
                                hint="Cap how many times one respondent can submit"
                            >
                                <NumberField
                                    value={settings.maxResponsesPerUser}
                                    onChange={set('maxResponsesPerUser')}
                                    placeholder="No limit"
                                />
                            </Row>
                            <Row
                                icon="timer"
                                title="Time limit per response"
                                hint="Respondents must finish within this window"
                            >
                                <NumberField
                                    value={settings.timeLimitPerResponse}
                                    onChange={set('timeLimitPerResponse')}
                                    placeholder="No limit"
                                    suffix="min"
                                />
                            </Row>
                        </div>
                    </section>

                    <section>
                        <SectionTitle index="02">Schedule</SectionTitle>
                        <div className="divide-theme-form-container-border mt-1 divide-y">
                            <Row
                                icon="calendar_clock"
                                title="Opens"
                                hint="Leave blank to accept responses immediately"
                            >
                                <DateField
                                    value={settings.startDate}
                                    onChange={set('startDate')}
                                />
                            </Row>
                            <Row
                                icon="event_available"
                                title="Closes"
                                hint="Leave blank to keep the form open indefinitely"
                            >
                                <DateField
                                    value={settings.closeDate}
                                    onChange={set('closeDate')}
                                />
                            </Row>
                        </div>
                    </section>

                    <section>
                        <SectionTitle index="03">Respondents</SectionTitle>
                        <div className="divide-theme-form-container-border mt-1 divide-y">
                            <Row
                                icon="mail"
                                title="Collect email addresses"
                                hint="Ask respondents to verify their email before starting"
                            >
                                <Toggle
                                    checked={settings.collectEmail}
                                    onChange={set('collectEmail')}
                                    label="Collect email addresses"
                                />
                            </Row>
                            <Row
                                icon="edit"
                                title="Allow editing after submit"
                                hint="Respondents can revisit and change their answers"
                            >
                                <Toggle
                                    checked={settings.allowEditResponse}
                                    onChange={set('allowEditResponse')}
                                    label="Allow editing after submit"
                                />
                            </Row>
                            <Row
                                icon="save"
                                title="Save and continue later"
                                hint="Respondents can leave and resume an in-progress response"
                            >
                                <Toggle
                                    checked={settings.saveAndContinueLater}
                                    onChange={set('saveAndContinueLater')}
                                    label="Save and continue later"
                                />
                            </Row>
                        </div>
                    </section>

                    <section>
                        <SectionTitle index="04">Behavior</SectionTitle>
                        <div className="divide-theme-form-container-border mt-1 divide-y">
                            <Row
                                icon="shuffle"
                                title="Shuffle question order"
                                hint="Show questions in a different order to each respondent"
                            >
                                <Toggle
                                    checked={settings.shuffleQuestions}
                                    onChange={set('shuffleQuestions')}
                                    label="Shuffle question order"
                                />
                            </Row>
                            <Row
                                icon="bar_chart"
                                title="Show progress bar"
                                hint="Display how far along respondents are"
                            >
                                <Toggle
                                    checked={settings.progressBar}
                                    onChange={set('progressBar')}
                                    label="Show progress bar"
                                />
                            </Row>
                        </div>
                    </section>

                    <section>
                        <SectionTitle index="05">After submission</SectionTitle>
                        <div className="mt-4 space-y-5">
                            <div className="flex gap-3">
                                <Icon
                                    name="chat_bubble"
                                    className="mt-2.5 shrink-0"
                                />
                                <div className="flex-1">
                                    <p className="text-[14px] leading-5">
                                        Confirmation message
                                    </p>
                                    <p className="mt-0.5 text-[12.5px] leading-4">
                                        Shown to respondents right after they
                                        submit
                                    </p>
                                    <textarea
                                        value={
                                            settings.customConfirmationMessage ??
                                            ''
                                        }
                                        onChange={(e) =>
                                            set('customConfirmationMessage')(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Thanks for your response."
                                        rows={2}
                                        className="border-theme-form-container-border mt-2 w-full resize-none rounded-md border px-3 py-2 text-[13.5px] focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Icon name="link" className="mt-2.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-[14px] leading-5">
                                        Redirect URL
                                    </p>
                                    <p className="mt-0.5 text-[12.5px] leading-4">
                                        Send respondents to another page instead
                                        of the confirmation message
                                    </p>
                                    <input
                                        type="url"
                                        value={settings.redirectUrl ?? ''}
                                        onChange={(e) =>
                                            set('redirectUrl')(e.target.value)
                                        }
                                        placeholder="https://example.com/thank-you"
                                        className="border-theme-form-container-border mt-2 w-full rounded-md border px-3 py-2 text-[13.5px] focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="border-theme-form-container-border mt-12 flex justify-end border-t pt-6">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-md bg-[#2F4858] px-4 py-2 text-[13.5px] font-medium text-white transition-colors"
                    >
                        Save changes
                    </button>
                </div>
            </div>
        </div>
    );
}
