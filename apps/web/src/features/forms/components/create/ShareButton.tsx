'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useForm } from '../../providers/form';
import {
    buildShortUrl,
    copyToClipboard,
    getOrCreateShareCode,
} from '../../lib/shareLink';

function ShareButton() {
    const { formId, form } = useForm();
    const [busy, setBusy] = useState(false);

    if (!formId) return null;

    const share = async () => {
        if (busy) return;
        setBusy(true);

        try {
            const code = await getOrCreateShareCode(formId);
            await copyToClipboard(buildShortUrl(code));
            toast.success('Short link copied');
            if (!form?.isPublished) {
                toast.info('Publish the form so others can fill it');
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Could not copy the link'
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            onClick={() => void share()}
            disabled={busy}
            aria-label="Copy shareable form link"
            title="Copy short link for filling"
            className="text-theme-form-on-surface/70 hover:bg-theme-form-container-active/10 hover:text-theme-form-on-surface flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
            <span className="material-symbols-outlined text-lg">link</span>
        </button>
    );
}

export default ShareButton;
