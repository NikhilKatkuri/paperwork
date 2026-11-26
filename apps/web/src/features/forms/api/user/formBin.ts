'use client';

import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import type { FormDB } from '@/types';
import formRepository from '../../repositories/formRepository';
import { cancelFlush } from '../../lib/sync-engine';
import { syncQueueRepository } from '../../lib/sync-queue.repository';

type Outcome = { changed: string[]; errors: string[] };

interface BinFormResponse {
    form?: { deletedAt?: string | null; isPublished?: boolean };
    deletedAt?: string | null;
    isPublished?: boolean;
}

interface BinListResponse {
    forms: FormDB[];
}

const messageOf = (error: unknown): string =>
    error instanceof Error ? error.message : 'Something went wrong';

async function runAll(
    ids: string[],
    action: (id: string) => Promise<void>
): Promise<Outcome> {
    const results = await Promise.allSettled(ids.map(action));
    const changed: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            changed.push(ids[index]);
        } else {
            errors.push(messageOf(result.reason));
        }
    });

    return { changed, errors };
}

/** Default delete: move one or more forms into the bin. */
export function moveFormsToBin(ids: string[]): Promise<Outcome> {
    return runAll(ids, async (id) => {
        cancelFlush(id);
        const res = await http.delete<BinFormResponse>(
            endpoints.forms.deleteForm(id)
        );
        const deletedAt =
            res.data?.form?.deletedAt ??
            res.data?.deletedAt ??
            new Date().toISOString();
        await formRepository.moveToBin(id, deletedAt);
    });
}

/** Restore one or more forms from the bin. */
export function restoreForms(ids: string[]): Promise<Outcome> {
    return runAll(ids, async (id) => {
        await http.post(endpoints.forms.restoreForm(id), {});
        await formRepository.restore(id);
    });
}

/** Irreversibly delete forms. Only intended for forms already in the bin. */
export function deleteFormsPermanently(ids: string[]): Promise<Outcome> {
    return runAll(ids, async (id) => {
        cancelFlush(id);
        await http.delete(endpoints.forms.deleteFormPermanent(id));
        await syncQueueRepository.deleteForForm(id);
        await formRepository.delete(id);
    });
}

/** Unpublish published forms from the dashboard. */
export function unpublishForms(ids: string[]): Promise<Outcome> {
    return runAll(ids, async (id) => {
        await http.post<BinFormResponse>(
            endpoints.forms.unpublishForm(id),
            {}
        );
        await formRepository.setPublished(id, false);
    });
}

export async function fetchBinForms(
    page: number = 1,
    limit: number = 20
): Promise<FormDB[]> {
    const res = await http.get<BinListResponse>(
        endpoints.forms.binForms(page, limit)
    );
    return res.data.forms ?? [];
}

export async function emptyBin(): Promise<number> {
    const res = await http.delete<{ scheduled?: number }>(endpoints.forms.emptyBin);
    const forms = await formRepository.getTrashed();
    await Promise.all(forms.map((form) => formRepository.delete(form.id)));
    return res.data?.scheduled ?? forms.length;
}
