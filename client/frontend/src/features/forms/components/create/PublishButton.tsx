'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import formRepository from '../../repositories/formRepository';
import { flushFormNow } from '../../lib/sync-engine';
import { useFormCreate } from '../../providers/FormCreate';

interface PublishResponse {
    success: boolean;
    message: string;
    data?: { form?: { isPublished?: boolean } };
}

/**
 * Publishes or unpublishes the form being edited.
 *
 * Pending local changes are flushed first: the publish endpoint flips a flag on
 * the stored document, so publishing with unsaved edits would publish the
 * previous version while the editor shows the new one.
 */
function PublishButton() {
    const { activeFormID, form, handleFormChange, questions, sections } =
        useFormCreate();

    const [busy, setBusy] = useState(false);

    const isPublished = Boolean(form?.isPublished);

    const toggle = useCallback(async () => {
        if (!activeFormID || busy) return;

        const next = !isPublished;

        if (next) {
            // The endpoint does no completeness checking, so catch the obvious
            // cases here rather than publishing something unusable.
            if (!form?.name?.trim()) {
                toast.error('Give the form a name before publishing');
                return;
            }

            if (questions.size === 0) {
                toast.error('Add at least one question before publishing');
                return;
            }

            if (sections.size === 0) {
                toast.error('Add at least one section before publishing');
                return;
            }
        }

        setBusy(true);

        try {
            // Push outstanding edits first so the published copy matches.
            const flushed = await flushFormNow(activeFormID);

            if (!flushed.sent && flushed.changes > 0) {
                toast.warning(
                    flushed.message ?? 'Some changes are not saved yet'
                );
                return;
            }

            const { path } = next
                ? endpoints.forms.publishForm(activeFormID)
                : endpoints.forms.unpublishForm(activeFormID);

            const res = await http.post<PublishResponse>(path, {});

            if (!res.data.success) {
                throw new Error(res.data.message || 'Failed to update');
            }

            // Trust the server's own value over the requested one.
            const confirmed = res.data.data?.form?.isPublished ?? next;

            handleFormChange('isPublished', confirmed);
            await formRepository.setPublished(activeFormID, confirmed);

            toast.success(confirmed ? 'Form published' : 'Form unpublished');
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update publish state'
            );
        } finally {
            setBusy(false);
        }
    }, [
        activeFormID,
        busy,
        form?.name,
        isPublished,
        questions.size,
        sections.size,
        handleFormChange,
    ]);

    if (!activeFormID) return null;

    return (
        <button
            type="button"
            onClick={() => void toggle()}
            disabled={busy}
            className={
                isPublished
                    ? 'border-theme-form-on-surface/30 text-theme-form-on-surface hover:bg-theme-form-on-surface/5 rounded-md border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60'
                    : 'bg-theme-form-container-active rounded-md px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
            }
        >
            {busy ? 'Working…' : isPublished ? 'Unpublish' : 'Publish'}
        </button>
    );
}

export default PublishButton;
