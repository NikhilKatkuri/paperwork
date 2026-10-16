'use client';
  
import { useForm } from '@/features/forms/providers/form';
import {
    ConditionOperator,
    SectionAction,
    SectionRule,
} from '@paperwork/types';
import { useEffect, useRef, useState } from 'react';

interface SectionControllerProps {
    size: number; 
    id: string;
    index: number;
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
    { value: 'EQUALS', label: 'is' },
    { value: 'NOT_EQUALS', label: 'is not' },
    { value: 'CONTAINS', label: 'contains' },
    { value: 'GREATER_THAN', label: 'greater than' },
    { value: 'LESS_THAN', label: 'less than' },
];

const stripHtml = (value: string): string =>
    value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Conditional jumps for a section ("if answer is X, go to §Y").
 * Evaluated top-down at fill time; the first matching rule wins, otherwise
 * the default action above applies.
 */
function SectionRulesEditor({ id }: Readonly<{ id: string }>) {
    const { sectionsMap, sectionOrder, questionsMap, updateSection } = useForm();

    const currentSection = sectionsMap.get(id);
    const currentIndex = currentSection?.index ?? 0;
    const rules = currentSection?.rules ?? [];

    // Only questions the respondent has seen: this section and earlier ones.
    // Plain computation (no useMemo): the maps mutate in place, which the
    // React Compiler cannot verify, and the lists are tiny.
    const sectionIndexById = new Map<string, number>();
    sectionsMap.forEach((s) => sectionIndexById.set(s.id, s.index));
    const eligibleQuestions = [...questionsMap.values()]
        .filter((q) => (sectionIndexById.get(q.sectionId) ?? 0) <= currentIndex)
        .toSorted((a, b) => a.index - b.index);

    const targets = sectionOrder
        .map((sid) => sectionsMap.get(sid))
        .filter((s) => s && s.id !== id)
        .map((s) => ({
            id: s!.id,
            title: stripHtml(s!.title || 'Untitled section'),
        }));

    const setRules = (next: SectionRule[]) => {
        updateSection(id, (prev) => ({ ...prev, rules: next }));
    };

    const addRule = () => {
        const first = eligibleQuestions[0];
        if (!first) return;
        setRules([
            ...rules,
            {
                questionId: first.id,
                operator: 'EQUALS',
                expectedValue: '',
                action: { type: 'NEXT_SECTION' },
            },
        ]);
    };

    const patchRule = (index: number, patch: Partial<SectionRule>) => {
        setRules(rules.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    };

    const patchRuleAction = (index: number, target: string) => {
        const action: SectionAction =
            !target || target === 'NEXT_SECTION'
                ? { type: 'NEXT_SECTION' }
                : target === 'SUBMIT_FORM'
                  ? { type: 'SUBMIT_FORM' }
                  : { type: 'GO_TO_SECTION', targetSectionId: target };
        patchRule(index, { action });
    };

    const ruleTarget = (rule: SectionRule): string => {
        if (!rule.action || rule.action.type === 'NEXT_SECTION')
            return 'NEXT_SECTION';
        if (rule.action.type === 'SUBMIT_FORM') return 'SUBMIT_FORM';
        return rule.action.targetSectionId ?? 'NEXT_SECTION';
    };

    return (
        <div className="mt-3 border-t border-dashed border-theme-form-container-border/60 pt-3">
            <p className="mb-2 text-xs font-medium text-theme-form-on-surface/70">
                Rules — jump based on an answer (first match wins)
            </p>
            {rules.length === 0 ? (
                <p className="mb-2 text-xs text-theme-form-on-surface/50">
                    No rules. The default action above always applies.
                </p>
            ) : (
                <ul className="mb-2 flex flex-col gap-2">
                    {rules.map((rule, i) => (
                        <li
                            key={`${rule.questionId}-${i}`}
                            className="flex flex-wrap items-center gap-1.5 rounded-lg bg-theme-form-on-surface/5 p-2"
                        >
                            <span className="text-xs text-theme-form-on-surface/60">
                                If
                            </span>
                            <select
                                value={rule.questionId}
                                onChange={(e) =>
                                    patchRule(i, { questionId: e.target.value })
                                }
                                aria-label="Rule question"
                                className="max-w-40 rounded-md border border-theme-form-container-border bg-transparent px-1.5 py-1 text-xs outline-none"
                            >
                                {eligibleQuestions.map((q) => (
                                    <option key={q.id} value={q.id}>
                                        {stripHtml(q.question) || 'Untitled'}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={rule.operator}
                                onChange={(e) =>
                                    patchRule(i, {
                                        operator: e.target
                                            .value as ConditionOperator,
                                    })
                                }
                                aria-label="Rule operator"
                                className="rounded-md border border-theme-form-container-border bg-transparent px-1.5 py-1 text-xs outline-none"
                            >
                                {OPERATORS.map((op) => (
                                    <option key={op.value} value={op.value}>
                                        {op.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={String(rule.expectedValue ?? '')}
                                onChange={(e) =>
                                    patchRule(i, {
                                        expectedValue: e.target.value,
                                    })
                                }
                                placeholder="value"
                                aria-label="Expected value"
                                className="w-24 rounded-md border border-theme-form-container-border bg-transparent px-1.5 py-1 text-xs outline-none"
                            />
                            <select
                                value={ruleTarget(rule)}
                                onChange={(e) =>
                                    patchRuleAction(i, e.target.value)
                                }
                                aria-label="Rule destination"
                                className="max-w-40 rounded-md border border-theme-form-container-border bg-transparent px-1.5 py-1 text-xs outline-none"
                            >
                                <option value="NEXT_SECTION">→ Next</option>
                                <option value="SUBMIT_FORM">→ Submit</option>
                                {targets.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        → {t.title}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() =>
                                    setRules(rules.filter((_, j) => j !== i))
                                }
                                aria-label="Delete rule"
                                className="material-symbols-outlined rounded p-1 text-sm text-red-500 opacity-60 hover:bg-red-50 hover:opacity-100"
                            >
                                close
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <button
                type="button"
                onClick={addRule}
                disabled={eligibleQuestions.length === 0}
                className="text-xs font-medium text-theme-form-container-active hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
            >
                + Add rule
            </button>
        </div>
    );
}

function SectionController({ size, id, index }: Readonly<SectionControllerProps>) {
    const { sectionsMap, updateSection, sectionOrder } = useForm();

    const [showModal, setShowModal] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentSection = sectionsMap.get(id);

    const sectionAction: SectionAction = currentSection?.defaultAction ?? {
        type: 'NEXT_SECTION',
    } satisfies SectionAction;

    const handleActionChange = (newAction: SectionAction) => {
        updateSection(id, (prev) => ({
            ...prev,
            defaultAction: newAction,
        }));
        setShowModal(false);
    };

    function getLabelForAction(action: SectionAction) {
        switch (action.type) {
            case 'NEXT_SECTION':
                return 'Continue to Next Section';
            case 'GO_TO_SECTION': {
                const targetSec = sectionsMap.get(action.targetSectionId!);
                return targetSec ? `Go to Section ${targetSec.index + 1}` : 'Go to Section';
            }
            case 'SUBMIT_FORM':
                return 'Submit Form';
            default:
                return 'Continue to Next Section';
        }
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setShowModal(false);
            }
        }

        if (showModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showModal]);

    if (size <= 1) return null;

    const showDefaultAction = index < size - 1;

    return (
        <div className="relative py-2 text-sm" ref={containerRef}>
            {showDefaultAction ? (
            <div className="flex items-center gap-3">
                <p>After Section {index + 1}</p>

                <div className="relative inline-block w-full md:max-w-64">
                    <button
                        type="button"
                        aria-expanded={showModal}
                        onClick={() => setShowModal((prev) => !prev)}
                        className="active:bg-theme-form-container-active/20 grid h-12 w-full cursor-pointer grid-cols-[1fr_24px] items-center rounded-md bg-transparent px-2 text-left"
                    >
                        <span>{getLabelForAction(sectionAction)}</span>
                        <span className="material-symbols-outlined pt-1">
                            stat_minus_1
                        </span>
                    </button>

                    {showModal && (
                        <div className="bg-theme-form-container-hover section_controller_modal absolute top-0 left-0 z-50 mt-1 flex w-64 flex-col rounded-xl py-2 shadow-lg">
                            <button
                                type="button"
                                className="hover:bg-theme-form-container-active/20 h-12 w-full px-4 text-start"
                                onClick={() =>
                                    handleActionChange({
                                        type: 'NEXT_SECTION',
                                    })
                                }
                            >
                                Continue to Next Section
                            </button>
 
                            {sectionOrder.map((secId) => {
                                const section = sectionsMap.get(secId);
                                if (!section) return null;
 
                                if (section.index === index + 1) return null;

                                return (
                                    <button
                                        key={secId}
                                        type="button"
                                        className="hover:bg-theme-form-container-active/20 h-12 w-full px-4 text-start"
                                        onClick={() =>
                                            handleActionChange({
                                                type: 'GO_TO_SECTION',
                                                targetSectionId: secId,
                                            })
                                        }
                                    >
                                        Go to Section {section.index + 1}
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                className="hover:bg-theme-form-container-active/20 h-12 w-full px-4 text-start"
                                onClick={() =>
                                    handleActionChange({
                                        type: 'SUBMIT_FORM',
                                    })
                                }
                            >
                                Submit Form
                            </button>
                        </div>
                    )}
                </div>
            </div>
            ) : null}

            <SectionRulesEditor id={id} />
        </div>
    );
}

export default SectionController;