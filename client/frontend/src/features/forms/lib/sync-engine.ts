import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { FormDB } from '@/lib/db';
import QuestionCore from '../types/question.type';
import SectionCore, { SectionAction } from '../types/section.type';
import formRepository from '../repositories/formRepository';
import { syncQueueRepository } from './sync-queue.repository';

interface SyncResponse {
    success: boolean;
    message: string;
}

export interface SyncOutcome {
    formId: string;
    /** Number of queued field changes collapsed into this request. */
    changes: number;
    sent: boolean;
    message?: string;
}

/** Idle time after the last edit before the batch is pushed. */
export const FLUSH_DEBOUNCE_MS = 4000;

/** Fields whose edits require the whole-form (bulk) endpoint. */
const BODY_PATHS = new Set(['sections', 'questions']);

function bodyChanged(paths: string[]): boolean {
    return paths.some((path) => BODY_PATHS.has(path));
}

type SectionWire = Record<string, unknown>;
type QuestionWire = Record<string, unknown>;

/** `zodObjectId` on the server only accepts 24-char hex. */
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function toSectionAction(
    action: SectionAction | undefined,
    sectionIdByIndex: Map<number, string>
): SectionWire | undefined {
    if (!action) return undefined;

    if (action.actionType !== 'GO_TO_SECTION') {
        return { actionType: action.actionType };
    }

    // The editor stores the target section's *position*, not its id, so it has
    // to be resolved here - sending the raw value fails validation with
    // "Invalid Database ID format" and takes the whole batch down with it.
    const resolved =
        sectionIdByIndex.get(Number(action.sectionId)) ??
        (OBJECT_ID.test(action.sectionId) ? action.sectionId : undefined);

    if (!resolved) return undefined;

    return { actionType: action.actionType, sectionId: resolved };
}

/**
 * Map the editor's shape onto what the API stores.
 *
 * The editor tracks a question's section positionally (`sectionIdx`), but the
 * database links questions to sections by id - so the section ids are resolved
 * here, and a question pointing at a section that no longer exists is dropped
 * rather than sent as a dangling reference.
 */
function toBody(sections: SectionCore[], questions: QuestionCore[]) {
    const sectionIdByIndex = new Map<number, string>(
        sections.map((s) => [s.index, s._id])
    );

    // Duplicate ids would make the server upsert both rows onto one document.
    const seenSectionIds = new Set<string>();

    const wireSections: SectionWire[] = [];
    const skipped: string[] = [];

    sections.forEach((s) => {
        if (seenSectionIds.has(s._id)) {
            skipped.push(s._id);
            return;
        }
        seenSectionIds.add(s._id);

        const defaultAction = toSectionAction(
            s.defaultAction,
            sectionIdByIndex
        );

        wireSections.push({
            _id: s._id,
            index: s.index,
            title: s.title,
            ...(s.description ? { description: s.description } : {}),
            ...(s.onAnswer ? { onAnswer: s.onAnswer } : {}),
            ...(defaultAction ? { defaultAction } : {}),
        });
    });

    const wireQuestions: QuestionWire[] = [];

    questions.forEach((q) => {
        const sectionId = sectionIdByIndex.get(q.sectionIdx);

        if (!sectionId || seenSectionIds.has(q._id)) {
            skipped.push(q._id);
            return;
        }
        seenSectionIds.add(q._id);

        wireQuestions.push({
            _id: q._id,
            index: q.index,
            sectionId,
            type: q.type,
            question: q.question,
            isRequired: Boolean(q.isRequired),
            ...(q.helpText ? { helpText: q.helpText } : {}),
            ...(q.placeholder ? { placeholder: q.placeholder } : {}),
            ...(q.options?.length
                ? { optionsConfig: { options: q.options } }
                : {}),
            ...(q.ratingConfig ? { ratingConfig: q.ratingConfig } : {}),
            ...(q.validationRule ? { validationRule: q.validationRule } : {}),
            ...(q.dependsOn ? { dependsOn: q.dependsOn } : {}),
        });
    });

    return { wireSections, wireQuestions, skipped };
}

/**
 * Build the wire payload.
 *
 * `formDataSchema` on the server is `.strict()`, so unknown keys are rejected -
 * only real `FormCore` fields may be sent. `name` is required non-empty, so a
 * form mid-rename is skipped rather than failing the whole batch.
 */
function toPayload(form: FormDB): Record<string, unknown> | null {
    const name = form.name?.trim();

    if (!name) return null;

    const isPrivate = Boolean(form.isPrivate);

    return {
        name,
        isPrivate,
        isPublished: Boolean(form.isPublished),
        // A `pre('save')` hook rejects a non-empty `allowedDomains` unless the
        // form is private, which would fail the entire batch. Send an empty
        // list to clear domains left over from when it *was* private.
        allowedDomains: isPrivate ? (form.allowedDomains ?? []) : [],
        ...(form.settings ? { settings: form.settings } : {}),
        ...(typeof form.responseCount === 'number'
            ? { responseCount: form.responseCount }
            : {}),
    };
}

/**
 * Push every pending change for one form as a **single** request.
 *
 * Fifteen edits to fifteen different fields still produce one HTTP call: the
 * queue is only used to decide *whether* a form needs syncing and to track the
 * rows to retire afterwards. The local IndexedDB record already holds the
 * coalesced result of all edits, so it is sent as-is rather than replayed field
 * by field.
 */
async function sendForm(
    formId: string,
    signal?: AbortSignal
): Promise<SyncOutcome> {
    const pending = await syncQueueRepository.getPending(formId);

    if (!pending.length) {
        return { formId, changes: 0, sent: false };
    }

    const form = await formRepository.get(formId);

    if (!form) {
        // Local record is gone (deleted elsewhere) - drop orphaned queue rows.
        await syncQueueRepository.deleteForForm(formId);
        return { formId, changes: pending.length, sent: false };
    }

    const payload = toPayload(form);

    if (!payload) {
        return {
            formId,
            changes: pending.length,
            sent: false,
            message: 'Form name is empty - not synced',
        };
    }

    const paths = pending.map((op) => op.path);

    // Sections and questions live in their own collections, so any change to
    // them needs the whole-form endpoint. Form-field-only edits use the cheaper
    // one. Either way it is a single request for the whole session.
    const useBulk = bodyChanged(paths);
    let body: Record<string, unknown> = payload;
    let skipped = 0;

    if (useBulk) {
        const mapped = toBody(form.sections ?? [], form.questions ?? []);

        body = {
            ...payload,
            sections: mapped.wireSections,
            questions: mapped.wireQuestions,
        };
        skipped = mapped.skipped.length;
    }

    const { path } = useBulk
        ? endpoints.forms.bulkUpdateForm(formId)
        : endpoints.forms.updateForm(formId);

    const res = await http.put<SyncResponse>(path, { data: body }, { signal });

    if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to sync form');
    }

    // Retire the queue rows only once the server has confirmed the write.
    await syncQueueRepository.markSynced(pending.map((op) => op.id));
    await syncQueueRepository.deleteSynced();
    await formRepository.markSynced(formId);

    return {
        formId,
        changes: pending.length,
        sent: true,
        message: skipped
            ? `${skipped} question(s) skipped - no matching section`
            : undefined,
    };
}

const inFlight = new Map<string, Promise<SyncOutcome>>();

type Listener = () => void;
const listeners = new Set<Listener>();

/** Notify subscribers that the queue or in-flight state changed. */
function emit(): void {
    listeners.forEach((listener) => listener());
}

/** Subscribe to sync state changes. Returns an unsubscribe function. */
export function onSyncChange(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** True while a flush is in flight for the given form. */
export function isSyncing(formId: string): boolean {
    return inFlight.has(formId);
}

/** Collapse concurrent flushes of the same form into one request. */
export function flushForm(
    formId: string,
    signal?: AbortSignal
): Promise<SyncOutcome> {
    const existing = inFlight.get(formId);

    if (existing) return existing;

    const promise = sendForm(formId, signal)
        .catch((e) => {
            emit();
            throw e;
        })
        .finally(() => {
            inFlight.delete(formId);
            emit();
        });

    inFlight.set(formId, promise);
    emit();

    return promise;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Debounce per form. Each new edit resets the timer, so an editing session with
 * many rapid changes still results in exactly one grouped request.
 */
export function scheduleFlush(
    formId: string,
    delay: number = FLUSH_DEBOUNCE_MS
): void {
    const existing = timers.get(formId);

    if (existing) clearTimeout(existing);

    timers.set(
        formId,
        setTimeout(() => {
            timers.delete(formId);
            emit();
            void flushForm(formId).catch((e) => {
                console.warn('[sync] flush failed for', formId, e);
            });
        }, delay)
    );

    emit();
}

/** Cancel a scheduled flush - used when a form is deleted. */
export function cancelFlush(formId: string): void {
    const existing = timers.get(formId);

    if (existing) {
        clearTimeout(existing);
        timers.delete(formId);
    }
}

/** Flush one form immediately, ignoring any pending debounce. */
export async function flushFormNow(
    formId: string,
    signal?: AbortSignal
): Promise<SyncOutcome> {
    cancelFlush(formId);
    return flushForm(formId, signal);
}

/** Flush every form that has queued changes, one request per form. */
export async function flushAllPending(
    signal?: AbortSignal
): Promise<SyncOutcome[]> {
    const formIds = await syncQueueRepository.getPendingFormIds();
    const results: SyncOutcome[] = [];

    for (const formId of formIds) {
        try {
            results.push(await flushFormNow(formId, signal));
        } catch (e) {
            results.push({
                formId,
                changes: 0,
                sent: false,
                message: e instanceof Error ? e.message : 'Sync failed',
            });
        }
    }

    return results;
}
